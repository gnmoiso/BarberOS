import * as signalR from '@microsoft/signalr'
import { storage } from '@/utils/storage'

let connection: signalR.HubConnection | null = null

/**
 * Single shared SignalR connection per session — the hub joins the caller's tenant group
 * automatically from the JWT, so every event raised here is already scoped to the right
 * barbershop (23.11.7). The browser can't set an Authorization header on the websocket
 * handshake, so the token travels via accessTokenFactory → ?access_token= query param,
 * which the server's JwtBearerEvents.OnMessageReceived picks up for /hubs/* paths only.
 */
export function getRealtimeConnection(): signalR.HubConnection {
  if (connection) return connection

  connection = new signalR.HubConnectionBuilder()
    .withUrl('/hubs/appointments', {
      accessTokenFactory: () => storage.getAccessToken() ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  return connection
}

export async function stopRealtimeConnection() {
  if (connection) {
    await connection.stop()
    connection = null
  }
}
