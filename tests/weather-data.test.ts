import { describe, it, beforeEach, expect } from "vitest"

describe("Weather Data Contract", () => {
  let mockStorage: Map<string, any>
  const CONTRACT_OWNER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  
  beforeEach(() => {
    mockStorage = new Map()
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "authorize-provider":
        if (sender !== CONTRACT_OWNER) {
          return { success: false, error: "ERR_NOT_AUTHORIZED" }
        }
        mockStorage.set(`provider-${args[0]}`, { authorized: true })
        return { success: true }
      
      case "revoke-provider-authorization":
        if (sender !== CONTRACT_OWNER) {
          return { success: false, error: "ERR_NOT_AUTHORIZED" }
        }
        mockStorage.set(`provider-${args[0]}`, { authorized: false })
        return { success: true }
      
      case "submit-weather-data":
        const [location, temperature, rainfall, humidity, windSpeed] = args
        if (!mockStorage.get(`provider-${sender}`)?.authorized) {
          return { success: false, error: "ERR_NOT_AUTHORIZED" }
        }
        mockStorage.set(`weather-${location}-${Date.now()}`, {
          temperature,
          rainfall,
          humidity,
          "wind-speed": windSpeed,
        })
        return { success: true }
      
      case "get-weather-data":
        return { success: true, value: mockStorage.get(`weather-${args[0]}-${args[1]}`) }
      
      case "is-authorized-provider":
        return { success: true, value: mockStorage.get(`provider-${args[0]}`)?.authorized || false }
      
      case "get-latest-weather-data":
        const weatherData = Array.from(mockStorage.entries())
            .filter(([key]) => key.startsWith(`weather-${args[0]}`))
            .sort(([keyA], [keyB]) => Number(keyB.split("-")[2]) - Number(keyA.split("-")[2]))
        return { success: true, value: weatherData.length > 0 ? weatherData[0][1] : null }
      
      default:
        return { success: false, error: "Unknown method" }
    }
  }
  
  it("should authorize a provider", () => {
    const result = mockContractCall("authorize-provider", ["provider1"], CONTRACT_OWNER)
    expect(result.success).toBe(true)
  })
  
  it("should not authorize a provider if not contract owner", () => {
    const result = mockContractCall("authorize-provider", ["provider1"], "user1")
    expect(result.success).toBe(false)
    expect(result.error).toBe("ERR_NOT_AUTHORIZED")
  })
  
  it("should revoke provider authorization", () => {
    mockContractCall("authorize-provider", ["provider1"], CONTRACT_OWNER)
    const result = mockContractCall("revoke-provider-authorization", ["provider1"], CONTRACT_OWNER)
    expect(result.success).toBe(true)
  })
  
  it("should submit weather data", () => {
    mockContractCall("authorize-provider", ["provider1"], CONTRACT_OWNER)
    const result = mockContractCall("submit-weather-data", ["New York", 25, 10, 60, 15], "provider1")
    expect(result.success).toBe(true)
  })
  
  it("should not submit weather data if not authorized", () => {
    const result = mockContractCall("submit-weather-data", ["New York", 25, 10, 60, 15], "provider1")
    expect(result.success).toBe(false)
    expect(result.error).toBe("ERR_NOT_AUTHORIZED")
  })
  
  it("should get weather data", () => {
    mockContractCall("authorize-provider", ["provider1"], CONTRACT_OWNER)
    mockContractCall("submit-weather-data", ["New York", 25, 10, 60, 15], "provider1")
    const result = mockContractCall("get-weather-data", ["New York", Date.now()], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toEqual({
      temperature: 25,
      rainfall: 10,
      humidity: 60,
      "wind-speed": 15,
    })
  })
  
  it("should check if a provider is authorized", () => {
    mockContractCall("authorize-provider", ["provider1"], CONTRACT_OWNER)
    const result = mockContractCall("is-authorized-provider", ["provider1"], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(true)
  })
  
  it("should get latest weather data", () => {
    mockContractCall("authorize-provider", ["provider1"], CONTRACT_OWNER)
    mockContractCall("submit-weather-data", ["New York", 25, 10, 60, 15], "provider1")
    mockContractCall("submit-weather-data", ["New York", 26, 5, 55, 20], "provider1")
    const result = mockContractCall("get-latest-weather-data", ["New York"], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toEqual({
      temperature: 26,
      rainfall: 5,
      humidity: 55,
      "wind-speed": 20,
    })
  })
})

