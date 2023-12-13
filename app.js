import express from "express";
import session from "express-session";
import RedisStore from "connect-redis";
import { createClient } from "redis";
import cookieParser from "cookie-parser";
import helmet from "helmet";
const app = express();

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});

const redisClient = createClient();
redisClient.connect();

const redisStore = new RedisStore({
  client: redisClient,
  prefix: "session:",
});

app.use(cookieParser());

app.use(helmet()); //helmet lägger till rekommenderade headers. 

app.use(
  session({
    secret: "myUnsafeSecret",
    saveUninitialized: false,
    resave: false,
    store: redisStore,
  })
);

app.get("/", (req, res) => {
  if (!req.session.pageViews) {
    req.session.pageViews = 0;
  }
  req.session.pageViews++;
  console.log(req.headers);
  res.send(`You have visited the page ${req.session.pageViews} times!`);
});

app.get("/json", (_req, res) => {
  res.json({ msg: "This is a JSON response!" }); //Nu kommer vi få "Content-type": "application/json"
});

app.get("/json_weird", (_req, res) => {
  res.set("Content-Type", "application/zip")
  res.json({ msg: "This is a JSON response!" }); //Nu kommer vi få "Content-type": "application/zip", mycket förvirrande för webbläsaren!
});

app.get("/script", (req, res) => {
  res.set("Content-Security-Policy", "script-src 'self'"); //Stänger av script med källa annan en själv.
  res.send(
    "<script src=https://cdn.jsdelivr.net/gh/Moksh45/host-xss.rocks/index.js></script>"
  );
});

app.get("/iframe", (_req, res) => {
  /* Clickjacking via en iframe */
  res.send(
    `<head>
    <style>
      #target_website {
        position:relative;
        width:128px;
        height:128px;
        opacity:0.00001;
        z-index:2;
        }
      #decoy_website {
        position:absolute;
        width:300px;
        height:400px;
        z-index:1;
        }
    </style>
  </head>
  <body>
    <div id="decoy_website">
    ...decoy web content here...
    </div>
    <iframe width="100%" height="1000px" id="victim_website" src="https://example.com" sandbox="allow-forms allow-scripts"></iframe>
  </body>`
  );
});

/*
1. Kolla på lite headers i / både i postman och webbläsaren
2. Sätt lite random headers som förvirrar.
3. Visa externa script
4. Visa iframe
5. Visa helmet
6. Vilka sårbarheter kan headers skydda mot? Vilka inte?
 */
