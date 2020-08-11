
import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { WebsocketService } from "./websocket.service";
import { Message } from '@app/_models/message';
import { environment } from 'environments/environment';
import { map } from 'rxjs/operators';
import { ɵAnimationGroupPlayer } from '@angular/animations';

@Injectable()
export class ChatService {
  public messages: Subject<Message>;

  constructor(public wsService: WebsocketService) {
    this.openSocket();
  }

  openSocket()
  {
    this.messages = <Subject<Message>>this.wsService
      .connect(environment.CHAT_URL)
      .pipe(map((response: MessageEvent): Message => {
          console.log(response.data);
          let data = JSON.parse(response.data);
          return {
            type: data.type,
            sender: data.sender,
            recipient: data.recipient,
            text: data.text,
            token: data.token,
            senderToken: data.senderToken,
            recipientToken: data.recipientToken
          };
        }
      ));
  }

  send(message : Message)
  {
    let clientMsg = Object.assign({}, message);
    console.log("Sending message '" + clientMsg.text + "' to " + clientMsg.recipient);
    this.messages.next(clientMsg);
  }
}