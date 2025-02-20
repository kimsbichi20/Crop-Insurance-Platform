;; Weather Data Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))

;; Data Maps
(define-map weather-data
  { location: (string-ascii 64), timestamp: uint }
  {
    temperature: int,
    rainfall: uint,
    humidity: uint,
    wind-speed: uint
  }
)

(define-map data-providers
  { provider: principal }
  { authorized: bool }
)

;; Public Functions
(define-public (authorize-provider (provider principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) (err ERR_NOT_AUTHORIZED))
    (ok (map-set data-providers { provider: provider } { authorized: true }))
  )
)

(define-public (revoke-provider-authorization (provider principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) (err ERR_NOT_AUTHORIZED))
    (ok (map-set data-providers { provider: provider } { authorized: false }))
  )
)

(define-public (submit-weather-data (location (string-ascii 64)) (temperature int) (rainfall uint) (humidity uint) (wind-speed uint))
  (begin
    (asserts! (is-authorized-provider tx-sender) (err ERR_NOT_AUTHORIZED))
    (ok (map-set weather-data
      { location: location, timestamp: block-height }
      {
        temperature: temperature,
        rainfall: rainfall,
        humidity: humidity,
        wind-speed: wind-speed
      }
    ))
  )
)

;; Read-only Functions
(define-read-only (get-weather-data (location (string-ascii 64)) (timestamp uint))
  (map-get? weather-data { location: location, timestamp: timestamp })
)

(define-read-only (is-authorized-provider (provider principal))
  (default-to false (get authorized (map-get? data-providers { provider: provider })))
)

(define-read-only (get-latest-weather-data (location (string-ascii 64)))
  (map-get? weather-data { location: location, timestamp: (- block-height u1) })
)

