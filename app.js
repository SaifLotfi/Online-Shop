const host = process.env.HOST;
const port = process.env.PORT || 3000;
const DB_URI = process.env.MONGO_URI;
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const http = require('http');
const app = express();
const User = require('./models/user');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const csrf = require('csurf');
const multer = require('multer');
const shopRouter = require('./routes/shop');
const adminRouter = require('./routes/admin');
const errorRouter = require('./routes/error');
const authRouter = require('./routes/auth');

// const privateKey = fs.readFileSync(path.join(__dirname, 'server.key'));
// const certificate = fs.readFileSync(path.join(__dirname, 'server.cert'));

const store = new MongoDBStore({
    uri: DB_URI,
    collection: 'mySessions',
    databaseName: 'shop',
});
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now().toString();
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});
const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
);

// app.use(
//     helmet({
//         contentSecurityPolicy: {
//             directives: {
//                 'script-src': ["'self'", 'https://js.stripe.com/v3/'],
//             },
//         },
//     })
// );
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.set('view engine', 'ejs');
app.set('views', 'views');

////////////////MiddleWares :-

app.get('/favicon.ico', (req, res) => res.status(204));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(multer({ storage: storage, fileFilter: fileFilter }).single('image'));

app.use(cookieParser('cookie-parser-secret'));

app.use(
    session({
        secret: 'some secret',
        resave: false,
        saveUninitialized: false,
        store: store,
    })
);

app.use(csrf({ cookie: true }));

app.use(flash());

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken(); //this check to avoid errors (req.csrfToken is not a function if it is a post request)
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.oldInput = (name) => {
        return req.body[name];
    };
    next();
});

app.use((req, res, next) => {
    if (req.session.isLoggedIn) {
        req.session.user = new User().init(req.session.user); // to make it a mongoose object that has all its methods defined in the model
    }
    next();
});

app.use(authRouter);

app.use(shopRouter);

app.use('/admin', adminRouter);

app.use(errorRouter);

// app.use((err, req, res, next) => {
//     res.status(500).render('500', {
//         layout: true,
//         pageTitle: '500',
//         path: req.url,
//         isAuthenticated: req.session.isLoggedIn,
//         csrfToken: req.csrfToken(),
//     });
// });

///////////////////////////////////

mongoose
    .connect(DB_URI, {
        dbName: 'shop',
    })
    .then((result) => {
        // http.createServer(
        //     { key: privateKey, certificate: certificate },
        //     app
        // ).listen(port, () => {
        //     console.log(`Server is running on http://${host}:${port}`);
        // });
        app.listen(port, () => {
            console.log(`Server is running on http://${host}:${port}`);
        });
    })
    .catch((err) => {
        console.log(err);
    });
