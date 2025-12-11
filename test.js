const WebSocket = require('ws');

const CHATROOM_ID = 34853685;

const subs = new Map();
let ws;

function connect() {
  if (ws) ws.terminate();

  ws = new WebSocket('wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=7.4.0&flash=false');

  ws.on('open', () => {
    ws.send(JSON.stringify({
      event: 'pusher:subscribe',
      data: { auth: '', channel: `chatrooms.${CHATROOM_ID}.v2` }
    }));
    console.clear();
  });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    console.log(msg)


    // Chat
    if (msg.event === 'App\\Events\\ChatMessageEvent') {
      try {
        const data = JSON.parse(msg.data);
        const user = data.sender?.username || '?';
        const text = data.content || '';
        if (text.trim()) console.log(`${user}: ${text}`);
      } catch {}
    }

    // Normal sub
    if (msg.event === 'App\\Events\\SubscriptionEvent') {
      const { username } = JSON.parse(msg.data);
      addSub(username, 1);
      console.log(`${username} 1`);
    }

    // Gifted subs (all events)
    if (msg.event.includes('Gifted') || msg.event.includes('GiftSubscription')) {
      try {
        const data = JSON.parse(msg.data);
        const gifter = data.gifter_username || data.sender?.username;
        const amount = data.gifted_usernames?.length || data.amount || 1;

        if (gifter && amount > 0) {
          addSub(gifter, amount);
          console.log(`${gifter} ${amount}`);
        }
      } catch {}
    }
  });

  ws.on('close', () => {
    console.log('\n');
    print();
    process.exit(0);
  });
}

function addSub(user, count) {
  subs.set(user, (subs.get(user) || 0) + count);
}

function print() {
  if (subs.size === 0) return console.log('no subs');

  [...subs.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([user, count]) => {
      console.log(`${user} ${count}`);
    });
}

process.on('SIGINT', () => {
  console.log('\n');
  print();
  process.exit(0);
});

connect();