import ky from 'ky'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchIPInfo, useIPInfo } from '../useIPInfo'

vi.mock('ky', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('fetchIPInfo with vpndetection.io', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads the caller IP and maps VPN, Tor and relay flags', async () => {
    vi.mocked(ky.get).mockReturnValue({
      json: vi.fn().mockResolvedValue({
        ip: '185.220.101.1',
        is_vpn: false,
        is_tor: true,
        is_relay: false,
        location: {
          country: 'DE',
          country_name: 'Germany',
          timezone: 'Europe/Berlin',
        },
        asn: { asn: 60729, name: 'Stiftung Erneuerbare Freiheit' },
      }),
    } as unknown as ReturnType<typeof ky.get>)

    const info = await fetchIPInfo('vpndetection.io')

    expect(ky.get).toHaveBeenCalledWith(
      'https://api.vpndetection.io/myip',
      expect.anything(),
    )
    expect(info).toEqual({
      ip: '185.220.101.1',
      country: 'Germany',
      countryCode: 'DE',
      asn: 60729,
      org: 'Stiftung Erneuerbare Freiheit',
      isProxy: true,
      isVPN: false,
      timezone: 'Europe/Berlin',
    })
  })
})

function response(value: unknown): ReturnType<typeof ky.get> {
  return {
    json: vi.fn().mockResolvedValue(value),
  } as unknown as ReturnType<typeof ky.get>
}

describe('current IP provider fallback', () => {
  beforeEach(() => vi.mocked(ky.get).mockReset())

  it('uses the requested provider without an HTTP cache or automatic retries', async () => {
    vi.mocked(ky.get).mockReturnValue(
      response({ ip: '203.0.113.1', country: 'JP' }),
    )
    const info = useIPInfo()
    await info.fetchIP('ipinfo.io')

    expect(ky.get).toHaveBeenCalledExactlyOnceWith('https://ipinfo.io/json', {
      timeout: 5000,
      retry: 0,
      cache: 'no-store',
    })
    expect(info.currentProvider.value).toBe('ipinfo.io')
    expect(info.ipInfo.value).toMatchObject({
      ip: '203.0.113.1',
      countryCode: 'JP',
    })
    expect(info.error.value).toBeNull()
    expect(info.isLoading.value).toBe(false)
  })

  it('falls back when a provider returns an invalid IP response', async () => {
    vi.mocked(ky.get)
      .mockReturnValueOnce(response({ error: 'rate limited' }))
      .mockReturnValueOnce(response({ ip: '203.0.113.2' }))
    const info = useIPInfo()
    await info.fetchIP()

    expect(vi.mocked(ky.get).mock.calls.map(([url]) => url)).toEqual([
      'https://api.ip.sb/geoip',
      'https://ipinfo.io/json',
    ])
    expect(info.currentProvider.value).toBe('ipinfo.io')
    expect(info.ipInfo.value?.ip).toBe('203.0.113.2')
  })

  it('reports each provider failure and clears stale IP information', async () => {
    const info = useIPInfo()
    vi.mocked(ky.get).mockReturnValue(response({ ip: '203.0.113.1' }))
    await info.fetchIP()
    vi.mocked(ky.get)
      .mockReset()
      .mockReturnValue({
        json: vi.fn().mockRejectedValue(new Error('network unavailable')),
      } as unknown as ReturnType<typeof ky.get>)
    await info.fetchIP('ipapi.is')

    expect(ky.get).toHaveBeenCalledTimes(5)
    for (const provider of [
      'ip.sb',
      'ipinfo.io',
      'ipwho.is',
      'ipapi.is',
      'vpndetection.io',
    ]) {
      expect(info.error.value).toContain(`${provider}: network unavailable`)
    }
    expect(info.ipInfo.value).toBeNull()
    expect(info.isLoading.value).toBe(false)
  })

  it('ignores a slow response after a newer refresh completes', async () => {
    const deferred = Promise.withResolvers<{ ip: string }>()
    vi.mocked(ky.get)
      .mockReturnValueOnce(response(deferred.promise))
      .mockReturnValueOnce(response({ ip: '203.0.113.2' }))
    const info = useIPInfo()
    const previous = info.fetchIP('ip.sb')
    await info.fetchIP('ipinfo.io')
    deferred.resolve({ ip: '203.0.113.1' })
    await previous

    expect(info.currentProvider.value).toBe('ipinfo.io')
    expect(info.ipInfo.value?.ip).toBe('203.0.113.2')
    expect(info.isLoading.value).toBe(false)
  })

  it('does not retry stale failures or clear the loading state of a newer request', async () => {
    const previousResponse = Promise.withResolvers<{ ip: string }>()
    const currentResponse = Promise.withResolvers<{ ip: string }>()
    vi.mocked(ky.get)
      .mockReturnValueOnce(response(previousResponse.promise))
      .mockReturnValueOnce(response(currentResponse.promise))
    const info = useIPInfo()
    const previous = info.fetchIP('ip.sb')
    const current = info.fetchIP('ipinfo.io')
    previousResponse.reject(new Error('superseded request failed'))
    await previous

    expect(ky.get).toHaveBeenCalledTimes(2)
    expect(info.isLoading.value).toBe(true)
    expect(info.error.value).toBeNull()
    currentResponse.resolve({ ip: '203.0.113.2' })
    await current
    expect(info.ipInfo.value?.ip).toBe('203.0.113.2')
    expect(info.isLoading.value).toBe(false)
  })
})
