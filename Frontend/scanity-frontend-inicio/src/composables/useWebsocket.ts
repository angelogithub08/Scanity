import { isNil } from 'lodash';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { API_URI } from 'src/boot/axios';

let socket: Socket;
let wasDisconnected = false;

export function useWebsocket() {
  async function getNewSocketConnection(): Promise<Socket> {
    const newSocketInstance = io(`${API_URI}`, {
      transports: ['polling', 'websocket', 'webtransport'],
    });
    const promise = new Promise((resolve, reject) => {
      try {
        newSocketInstance.on('connect', () => {
          resolve(newSocketInstance);
        });
      } catch {
        reject(new Error('Erro ao conectar ao socket'));
      }
    });
    await promise;
    return newSocketInstance;
  }

  async function getSocketConnection(newSocket = false): Promise<Socket> {
    if (newSocket) {
      return await getNewSocketConnection();
    }

    if (isNil(socket)) {
      socket = io(`${API_URI}`, {
        transports: ['polling', 'websocket', 'webtransport'],
      });
      const promise = new Promise((resolve, reject) => {
        try {
          socket.on('connect', () => {
            resolve(socket);
          });
        } catch {
          reject(new Error('Erro ao conectar ao socket'));
        }
      });
      await promise;
    }

    return socket;
  }

  function onReconnect(callback: () => void): void {
    if (isNil(socket)) {
      console.warn('Socket não está inicializado. Chame getSocketConnection() primeiro.');
      return;
    }

    // Monitora desconexões
    socket.on('disconnect', (reason) => {
      console.log('Socket desconectado:', reason);
      wasDisconnected = true;
    });

    // Monitora conexões (incluindo reconexões)
    socket.on('connect', () => {
      if (wasDisconnected) {
        console.log('Socket reconectado com sucesso');
        callback();
        wasDisconnected = false;
      } else {
        console.log('Socket conectado pela primeira vez');
      }
    });

    // Monitora tentativas de reconexão
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Tentativa de reconexão #${attemptNumber}`);
    });

    // Monitora reconexão bem-sucedida (evento específico do Socket.IO)
    socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconectado após ${attemptNumber} tentativas`);
      callback();
    });

    // Monitora falhas de reconexão
    socket.on('reconnect_failed', () => {
      console.log('Falha ao reconectar');
    });
  }

  return { getSocketConnection, onReconnect, getNewSocketConnection };
}
