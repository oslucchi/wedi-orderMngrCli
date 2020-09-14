import { Component, OnInit } from '@angular/core';
import { Message } from '@app/_models/message';
import { User } from '@app/_models/user';
import { DatePipe } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { toBase64String } from '@angular/compiler/src/output/source_map';
import { MatInputNumericDirective } from '@app/_directives/mat-input-numeric.directive';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent implements OnInit {
  private ws: WebSocket;
  public msg: Message = new Message();
  public textarea: string = "";
  public msgType: number = Message.MSG_BROADCAST;
  public userList: User[] = new Array();
  public logged: boolean = false;
  public name: string;
  private token: string = "";
  public tokenSelected: string;
  private today: Date;
  public timerSet: number = 1;
  public timerReset: boolean = false;
  public msgTypeList: any = [
    { id: Message.MSG_PRIVATE, des: "Privato", selected: false, disabled: false},
    { id: Message.MSG_BROADCAST, des: "Broadcast", selected: true, disabled: false}
  ];
  public cookieValue: string;
  private keepAliveStatus: boolean = false;
  public connectionStatus = false;

  constructor(// public wsService: WebsocketService,
              // public chatService: ChatService,
              public datepipe: DatePipe,
              public cookieService: CookieService) 
  {
  }

  ngOnInit()
  {
    this.startWebSocket(this);
  }
  
  startWebSocket(instance: ChatComponent)
  {
    console.log("Creating new socket on " + environment.CHAT_URL);
    instance.ws = new WebSocket(environment.CHAT_URL);

    instance.ws.onmessage = (event) => {
      console.log("Message received: " + event.data);
      var msg: Message = JSON.parse(event.data);
      console.log("Message from WebSocket Server: " + msg.idMessage + 
                  " type: " + msg.type);
      var from: string = "";
      var now = new Date(), 
          expires = new Date(now.getFullYear() + 1, now.getMonth() + 1, now.getDate());
      msg.timestamp = new Date();
      switch(msg.type)
      {
        case Message.MSG_LOGON_CONF:
          instance.logged = true;
          instance.token = msg.text;
          if ((instance.name == null) || (instance.name == ""))
          {
            instance.name = msg.recipient;
          }
          instance.cookieService.set('chatToken', instance.token, expires);
          instance.cookieService.set('chatName', msg.recipient, expires);
          break;

        case Message.MSG_ADD_USER:
          var newUser: User = <User>(msg.text);
          if (instance.userList.find(x => x.token == newUser.token) == null)
          {
            instance.userList.push(newUser);
          }
          break;

          case Message.MSG_HISTORY:
            instance.textarea = atob(msg.text);
            break;
  
          case Message.MSG_RMV_USER:
            var user = <User> (msg.text);
            instance.userList = instance.userList.filter(function(item) {
              return item.token != user.token
            })
            break;

          case Message.MSG_BROADCAST:
          case Message.MSG_PRIVATE:
            instance.today  = new Date();
            instance.textarea += "[" + instance.datepipe.transform(msg.timestamp, 'HH:mm:ss') + "] <= " +
                            msg.sender + (msg.type == Message.MSG_BROADCAST ? " (B)" : "" ) +
                            ": " + msg.text + "\n";
            break;
          case Message.MSG_KEEP_ALIVE_RESPONSE:
            instance.keepAliveStatus = false;
            console.log("KEEP_ALIVE_RESPONSE received");
      }
    };

    instance.ws.onopen = () => {
      console.log("OnOpen received");
      instance.connectionStatus = true;
      instance.logonWithToken();
    };

    instance.ws.onclose = () => {
      console.log("OnClose received");
      instance.connectionStatus = false;
      this.textarea += "\n\n**** SERVER NON RAGGIUNGIBILE. SERVIZIO SOSPESO ****";
      setTimeout(instance.startWebSocket, 5000, instance);
    };

  }

  logonWithToken() 
  {
    var cookieUserName = (this.cookieService.get('chatName') == null ? "" : this.cookieService.get('chatName'));
    var cookieToken = this.cookieValue = (this.cookieService.get('chatToken') == null ? "" : this.cookieService.get('chatToken'));
     
    if ((cookieUserName != "") && (cookieToken != ""))
    {
      this.msg.type = Message.MSG_LOG_WITH_TOKEN;
      this.msg.sender = cookieUserName;
      this.name = this.msg.sender;
      this.msg.recipient = "server";
      this.msg.recipientToken = "";
      this.msg.senderToken = this.cookieValue;
      this.msg.text = "logon with token";
      this.msg.token = this.cookieValue;
      console.log("Trying to connect the websocket after the page is up on user '" +
                  this.msg.sender + "' token '" + this.msg.token + "'");
      this.ws.send(JSON.stringify(this.msg));
      this.msg.recipient = "";
      this.msg.text = "";
    }  
  }

  sendMsg() 
  {
    var user : User;

    console.log("new message sent from client");
    if (this.msgType == Message.MSG_PRIVATE)
    {
      user = this.userList.find(x => x.selected);
    }
    else 
    {
      user = new User();
      if (this.msgType == Message.MSG_BROADCAST)
      {
        user.account = "broadcast";
      }
      else
      {
        user.account = "service";
      }
      user.token = "";
    }

    this.msg.type = this.msgType | 0;
    this.msg.sender = this.name;
    this.msg.token = this.token;
    this.msg.recipientToken = user.token;
    this.msg.recipient = user.account;
    console.log("sendMsg: sending msg via chatService: '" + JSON.stringify(this.msg) +"'");
    this.ws.send(JSON.stringify(this.msg));
    this.today  = new Date();
    this.textarea += "[" + this.datepipe.transform(this.today, 'HH:mm:ss') + "] => " +
                     this.msg.recipient + ": " + this.msg.text + "\n";
    this.msg.recipient = "";
    this.msg.text = "";
    this.timerReset = true;
  }

  logon()
  {
    if (this.name == "")
    {
      alert("Deve essere obbligatoriamente indicato un nome utente");
      return;
    }
    this.msg.type = Message.MSG_LOGON;
    this.msg.sender = this.name;
    this.msg.recipient = "server";
    this.msg.text = "logon";
    this.msg.senderToken = "";
    this.msg.recipientToken = "";
    this.msg.token = "";
    console.log("logon: sending msg via chatService: '" + JSON.stringify(this.msg) +"'");
    this.ws.send(JSON.stringify(this.msg));
    this.msg.recipient = "";
    this.msg.text = ""; 
  }

  setSelected(event:any)
  {
    console.log("Selected token '" + this.tokenSelected +"'");
    this.userList.forEach(item => {
      item.selected = false;
    });
    this.userList.find(x => x.token === this.tokenSelected).selected = true;
  }

  keepAlive()
  {
    if (this.keepAliveStatus)
    {
      this.startWebSocket(this);
      return;
    }
    this.keepAliveStatus = true;
    console.log("Send a keep alive message to server");
    this.msg.type = Message.MSG_KEEP_ALIVE;
    this.msg.sender = this.name;
    this.msg.token = this.token;
    this.msg.recipient = "server";
    this.msg.text = "PING";
    this.msg.senderToken = "";
    this.msg.recipientToken = "";
    console.log("logon: sending msg via chatService: '" + JSON.stringify(this.msg) +"'");
    this.ws.send(JSON.stringify(this.msg));
    this.msg.recipient = "";
    this.msg.text = ""; 
  }
}