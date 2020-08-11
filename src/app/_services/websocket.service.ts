import { Injectable } from "@angular/core";
import * as Rx from "rxjs";
import { environment } from 'environments/environment';
import { Message } from '@angular/compiler/src/i18n/i18n_ast';


@Injectable()
export class WebsocketService {
  private subject: Rx.Subject<MessageEvent>;
// constructor() { }

// public connect(url): Rx.Subject<MessageEvent> {
  constructor() {
    if (!this.subject) {
      this.subject = this.create(environment.CHAT_URL);
      console.log("Successfully connected: " + environment.CHAT_URL);
    }
  }

  // Make the function wait until the connection is made...
  waitForSocketConnection(socket: WebSocket, callback: any, numOfRun: number)
  {
    console.log("waiting for socket openend: " + numOfRun++)
    setTimeout(
        function () {
            if (socket.readyState === WebSocket.OPEN) 
            {
                if (callback != null)
                {
                    callback();
                }
            } 
            else 
            {
                this.waitForSocketConnection(socket, callback, numOfRun);
            }

        }, 200); // wait 5 milisecond for the connection...
}

  public connect(url): Rx.Subject<MessageEvent> {
    if (!this.subject) {
      this.subject = this.create(url);
      console.log("Successfully connected: " + url);
    }
    return this.subject;
  }

  private create(url): Rx.Subject<MessageEvent> {
    let ws = new WebSocket(url);

    let observable = Rx.Observable.create(
      (obs: Rx.Observer<MessageEvent>) => {
        ws.onmessage = obs.next.bind(obs);
        ws.onerror = obs.error.bind(obs);
        ws.onclose = obs.complete.bind(obs);
        return ws.close.bind(ws);
    });
    let observer = {
      next: (data: Object) => {
          this.waitForSocketConnection(ws, function(){
              console.log("now sending the message '"+ JSON.stringify(data) + "' to " +
                          ws.url + "(state " + ws.readyState + ")");
              ws.send(JSON.stringify(data));
            }, 1);    
      }
    };
    return Rx.Subject.create(observer, observable);
  }
}