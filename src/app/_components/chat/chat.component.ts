import { Component, OnInit } from '@angular/core';
import { Message } from '@app/_models/message';
import { User } from '@app/_models/user';
import { ChatService } from '@app/_services/chat.service';
import { DatePipe } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { toBase64String } from '@angular/compiler/src/output/source_map';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  public msg: Message = new Message();
  public textarea: string = "";
  public msgType: number = Message.MSG_BROADCAST;
  public userList: User[] = new Array();
  public logged: boolean = false;
  public name: string;
  private token: string = "";
  public tokenSelected: string;
  private today: Date;
  public msgTypeList: any = [
    { id: Message.MSG_PRIVATE, des: "Privato", selected: false, disabled: false},
    { id: Message.MSG_BROADCAST, des: "Broadcast", selected: true, disabled: false}
  ];
  public cookieValue: string;

  constructor(public chatService: ChatService,
              public datepipe: DatePipe,
              public cookieService: CookieService) {
    this.chatService.messages.subscribe(msg => {
      console.log("Message from WebSocket Server: " + msg);
      var from: string = "";
      var now = new Date(), 
          expires = new Date(now.getFullYear() + 1, now.getMonth() + 1, now.getDate());
      switch(msg.type)
      {
        case Message.MSG_LOGON_CONF:
          this.logged = true;
          this.token = msg.text;
          if ((this.name == null) || (this.name == ""))
          {
            this.name = msg.recipient;
          }
          this.cookieService.set('chatToken', this.token, expires);
          this.cookieService.set('chatName', msg.recipient, expires);
          break;

        case Message.MSG_ADD_USER:
          var newUser: User = <User>(msg.text);
          if (this.userList.find(x => x.token == newUser.token) == null)
          {
            this.userList.push(newUser);
          }
          break;

          case Message.MSG_HISTORY:
            this.textarea = atob(msg.text);
            break;
  
          case Message.MSG_RMV_USER:
            var user = <User> (msg.text);
            this.userList = this.userList.filter(function(item) {
              return item.token != user.token
            })
            break;

          case Message.MSG_BROADCAST:
          case Message.MSG_PRIVATE:
            this.today  = new Date();
            this.textarea += "[" + this.datepipe.transform(this.today, 'HH:mm:ss') + "] <- " +
                            msg.sender + ": " + msg.text + "\n";
            break;
      }
    });
  }

  ngOnInit() 
  {
    this.cookieValue = this.cookieService.get('chatToken');
    if ((this.cookieValue != null) && (this.cookieValue != ""))
    {
      this.msg.type = Message.MSG_LOG_WITH_TOKEN;
      this.msg.sender = this.cookieService.get('chatName');;
      this.name = this.msg.sender;
      this.msg.recipient = "server";
      this.msg.recipientToken = "";
      this.msg.senderToken = this.cookieValue;
      this.msg.text = "logon with token";
      this.msg.token = this.cookieValue;
      console.log("Trying to connect the websocket after the page is up on user '" +
                  this.msg.sender + "' token '" + this.msg.token + "'");
      this.chatService.messages.next(this.msg);
      this.msg.recipient = "";
      this.msg.text = "";
    }  
  }

  ngAfterViewInit()
  {
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
      user.account = "broadcast";
      user.token = "";
    }

    this.msg.type = this.msgType | 0;
    this.msg.sender = this.name;
    this.msg.token = this.token;
    this.msg.recipientToken = user.token;
    this.msg.recipient = user.account;
    this.chatService.send(this.msg);
    this.today  = new Date();
    this.textarea += "[" + this.datepipe.transform(this.today, 'HH:mm:ss') + "] -> " +
                     this.msg.recipient + ": " + this.msg.text + "\n";
    this.msg.recipient = "";
    this.msg.text = ""; 
  }

  logon()
  {
    this.msg.type = Message.MSG_LOGON;
    this.msg.sender = this.name;
    this.msg.recipient = "server";
    this.msg.text = "logon";
    this.chatService.messages.next(this.msg);
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
}