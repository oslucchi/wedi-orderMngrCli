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

    type: number;
    sender: string;
    recipient: string;
    text: any;
    senderToken: string;
    recipientToken: string;
    token: string;
}
