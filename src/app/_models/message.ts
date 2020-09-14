export class Message {
    static MSG_LOGON = 1;
    static MSG_LOGOFF = 2;
    static MSG_BROADCAST = 3;
    static MSG_PRIVATE = 4;
    static MSG_ADD_USER = 5;
    static MSG_RMV_USER = 6;
    static MSG_LOGON_CONF = 7;
    static MSG_LOG_WITH_TOKEN = 8;
    static MSG_HISTORY = 9;
    static MSG_LOGON_DENY = 10;
    static MSG_KEEP_ALIVE = 11;
    static MSG_KEEP_ALIVE_RESPONSE = 12;

    idMessage: number;
    timestamp: Date;
    type: number;
    recipient: string;
    sender: string;
    text: any;
    token: string;
    senderToken: string;
    recipientToken: string;
}
