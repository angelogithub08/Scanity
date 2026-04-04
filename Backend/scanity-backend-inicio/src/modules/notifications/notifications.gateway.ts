import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server } from 'socket.io';
import { Notification } from './entities/notification.entity';

type NotificationsJoinPayload = {
  user_id: string;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  private getRoom(userId: string) {
    return `notifications:user:${userId}`;
  }

  @SubscribeMessage('notifications:user:join')
  handleUserJoin(
    @MessageBody() payload: NotificationsJoinPayload,
    @ConnectedSocket() client: any,
  ) {
    if (!payload?.user_id) return;
    void client.join(this.getRoom(payload.user_id));
  }

  @SubscribeMessage('notifications:user:leave')
  handleUserLeave(
    @MessageBody() payload: NotificationsJoinPayload,
    @ConnectedSocket() client: any,
  ) {
    if (!payload?.user_id) return;
    void client.leave(this.getRoom(payload.user_id));
  }

  emitUpsert(notification: Notification) {
    if (!notification.user_id) return;
    if (!this.server) return;
    this.server
      .to(this.getRoom(notification.user_id))
      .emit('notifications:upsert', notification);
  }
}
