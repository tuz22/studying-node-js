const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('vew engine', 'ejs');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
require('dotenv').config();

/* middleware : 요청과 응답 사이에 동작하는 코드 */
app.use('/public', express.static('public')); // static 파일을 보관하기 위해 public폴더를 쓸 것

var db;

const MongoClient = require('mongodb').MongoClient;
MongoClient.connect(process.env.DB_URL, function (에러, client) {
    // 연결되면 실행
    if (에러) return console.log(에러);

    db = client.db('todoapp'); // 데이터 저장할 폴더 명시

    // db.collection('post').insertOne({_id: 0, 이름: 'Kim', 나이: 20}, function(에러, 결과){ // 저장할 데이터는 Object 자료형으로
    //     console.log('저장완료');
    // });

    app.listen(process.env.PORT, function () {
        // listen(서버 띄울 포트번호, 띄운 후 실행할 코드)
        console.log('listening on 8080');
    }); // 서버를 띄우기 위한 기본 세팅
});

/* get 요청 */
// app.get('/pet', (요청, 응답) => {});
app.get('/pet', function (요청, 응답) {
    //  req, res
    응답.send('펫용품 쇼핑 페이지 입니다.');
});

/* 서버에서 HTML 파일 전송 */
app.get('/', function (요청, 응답) {
    //  req, res
    // 응답.sendFile(__dirname + '/index.html');
    응답.render('index.ejs'); // ejs파일로 변경해서
});

app.get('/write', function (요청, 응답) {
    응답.sendFile(__dirname + '/write.html');
    응답.render('write.ejs');
});

/* HTML에 DB 데이터 넣기 (EJS) */
/* ejs 파일은 views 폴더 내에 위치해야함 */
app.get('/list', function (요청, 응답) {
    db.collection('post')
        .find()
        .toArray(function (에러, 결과) {
            // DB에 저장된 post라는 collection안의 모든 데이터를 꺼내기
            console.log(결과);
            응답.render('list.ejs', { posts: 결과 }); // 찾은 데이터 ejs파일에 넣기
        });
});

/* detail : 해당 글 번호의 상세페이지 이동 */
// URL parameter
app.get('/detail/:id', function (요청, 응답) {
    db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
        console.log(결과);
        응답.render('detail.ejs', { data: 결과 });
    });
});

/* edit : 수정 */
// 수정페이지 이동
app.get('/edit/:id', function (요청, 응답) {
    db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
        console.log(결과);
        응답.render('edit.ejs', { post: 결과 });
    });
});

// PUT; 수정하기
app.put('/edit', function (요청, 응답) {
    // updateOne(수정할 것, 수정할 값, 콜백함수)
    db.collection('post').updateOne(
        { _id: parseInt(요청.body.id) },
        { $set: { title: 요청.body.title, date: 요청.body.date } },
        function (에러, 결과) {
            console.log('수정완료');
            응답.redirect('/list');
        }
    );
});

/* Session으로 로그인 기능 구현*/
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');

// 로그인 요청시 아이디, 비번 검증 미들웨어 실행
// app.use(middleware)
// *middleware : 요청-응답 중간에 실행되는 코드
app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function (요청, 응답) {
    응답.render('login.ejs');
});

app.post(
    '/login',
    passport.authenticate('local', {
        // local방식으로 검사
        failureRedirect: '/fail', // 회원인증 실패 시 /fail로 이동
    }),
    function (요청, 응답) {
        응답.redirect('/'); // 회원인증 성공 시 /로 이동
    }
);

// 마이페이지로 이동
app.get('/mypage', 로그인했니, function (요청, 응답) {
    // 요청.user: deserializeUser()에서 찾은 사용자 정보
    console.log(요청.user);
    응답.render('mypage.ejs', { 사용자: 요청.user });
});

// 마이페이지 이동 전 실행할 미들웨어
function 로그인했니(요청, 응답, next) {
    if (요청.user) {
        next();
    } else {
        응답.send('로그인안함');
    }
}

// DB의 아이디 비번과 맞는지 비교
passport.use(
    new LocalStrategy(
        {
            usernameField: 'id', // 사용자가 입력한 아이디 비번 항목 정의(name속성)
            passwordField: 'pw',
            session: true, // 로그인 후 세션을 저장할 것인지
            passReqToCallback: false, // 아이디, 비번 외에 다른 것 인증 여부
        },
        function (입력한아이디, 입력한비번, done) {
            //console.log(입력한아이디, 입력한비번);
            db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
                if (에러) return done(에러);

                // done(서버에러, 성공 시 사용자 DB 데이터, 에러메시지)
                if (!결과) return done(null, false, { message: '존재하지않는 아이디요' });
                if (입력한비번 == 결과.pw) {
                    return done(null, 결과); // * 여기 결과가
                } else {
                    return done(null, false, { message: '비번틀렸어요' });
                }
            });
        }
    )
);

// 로그인 성공시 세션에 저장
// 세션 데이터를 만들고 세션의 id 정보를 쿠키로 보냄
passport.serializeUser(function (user, done) {
    // * 여기 user로 들어감
    done(null, user.id);
});

// 로그인한 사용자의 개인정보를 DB에서 찾기
passport.deserializeUser(function (아이디, done) {
    // DB에서 위에 있는 user.id로 찾은 사용자 정보를
    // done(null, {여기에 넣음});
    db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) {
        done(null, 결과); // 결과: {id: 아이디값, pw: 비번값}
    });
});

/* 회원가입 */
app.post('/register', function (요청, 응답) {
    db.collection('login').insertOne({ id: 요청.body.id, pw: 요청.body.pw }, function (에러, 결과) {
        응답.redirect('/');
    });
});

/* post 요청 */
app.post('/add', function (요청, 응답) {
    // input에 적은 정보는 '요청'에 저장되어있음. 쉽게 사용하려면 라이브러리(body-parser) 필요
    응답.send('전송완료');

    // 1. DB.collection 내의 총 게시물갯수를 찾음
    db.collection('counter').findOne({ name: '게시물갯수' }, function (에러, 결과) {
        console.log(결과.totalPost);

        // 2. 총 게시물갯수를 변수에 저장
        var 총게시물갯수 = 결과.totalPost;
        var 저장할거 = { _id: 총게시물갯수 + 1, title: 요청.body.title, date: 요청.body.date, writer: 요청.user._id };

        // 3. DB.collection에 새 게시물을 기록
        db.collection('post').insertOne(저장할거, function (에러, 결과) {
            console.log('저장완료');

            // 4. counter란 collection에 이름이 게시물갯수인 것을 찾아서 totalPost란 항목을 1 증가시킴
            // db.collection('counter').updateOne({어떤데이터를 수정할지}, {수정값}, function(){})
            db.collection('counter').updateOne(
                { name: '게시물갯수' },
                { $inc: { totalPost: 1 } },
                function (에러, 결과) {
                    if (에러) {
                        return console.log(에러);
                    }
                }
            );
        });

        /* 
            operator 
            - $set : 변경
            - $inc : 증가
            - $min : 기존값보다 적을 때만 변경
            - $rename : key값 이름 변경
            ...
        
        */
    });
});

/* DB에서 데이터 삭제하기 */
app.delete('/delete', function (요청, 응답) {
    console.log(요청.body); // 요청시 함께 보낸 데이터를 찾기(게시글 번호)
    요청.body._id = parseInt(요청.body._id); // 문자가 된 id값을 다시 숫자로 변환

    var 삭제할데이터 = { _id: 요청.body._id, writer: 요청.user._id }; // body._id의 글에 저장된 작성자 id와 동일할 때 삭제
    db.collection('post').deleteOne(삭제할데이터, function (에러, 결과) {
        console.log('삭제완료');
        if (에러) {
            console.log(에러);
        }
        응답.status(200).send({ message: '성공' });
    });
});

/* 채팅 */
const { ObjectId } = require('mongodb');

// 채팅방 개설
app.post('/chatroom', 로그인했니, function (요청, 응답) {
    var 저장할거 = {
        title: '뫄뫄채팅방',
        // member: [요청.body.채팅받은유저id, 요청.user._id], // 이렇게 쓰면 0번째거 string으로 나옴
        member: [ObjectId(요청.body.채팅받은유저id), 요청.user._id], // ObjectId() 사용 시 ObjectId에 담김
        date: new Date(),
    };
    db.collection('chatroom')
        .insertOne(저장할거)
        .then((결과) => {
            응답.send('성공');
        });
});

app.get('/chat', 로그인했니, function (요청, 응답) {
    db.collection('chatroom')
        .find({ member: 요청.user._id })
        .toArray()
        .then((결과) => {
            console.log(결과);
            응답.render('chat.ejs', { data: 결과 });
        });
});

// 채팅 데이터 전송
app.post('/message/:id', 로그인했니, function (요청, 응답) {
    var 저장할거 = {
        parent: 요청.body.parent,
        content: 요청.body.content,
        userid: 요청.user._id,
        date: new Date(),
    };
    db.collection('message')
        .insertOne(저장할거)
        .then(() => {
            console.log('DB저장 성공');
            응답.send('DB저장 성공');
        });
});

// 실시간 소통채널 열기
app.get('/message/:id', 로그인했니, function (요청, 응답) {
    응답.writeHead(200, {
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
    });

    db.collection('message')
        .find({ parent: 요청.params.id })
        .toArray()
        .then((결과) => {
            응답.write('event: test\n'); // 사용자에게 데이터 전송 - event: 보낼데이터이름\n
            // 응답.write('data:' + 결과 + '\n\n'); // 사용자에게 데이터 전송 - data: 보낼데이터\n\n
            // -> 이렇게 보내면 toArray()때문에 깨짐. 서버에서 실시간 전송시 문자자료만 전송 가능
            응답.write('data: ' + JSON.stringify(결과) + '\n\n'); // JSON으로 보내기
        });
});

/* 검색 */
app.get('/search', (요청, 응답) => {
    console.log(요청.query); // { value: '쿠키숙제하기' }
    console.log(요청.query.value); // 쿠키숙제하기

    var 검색조건 = [
        {
            $search: {
                index: 'titleSearch', // index name
                text: {
                    query: 요청.query.value, // 검색 키워드
                    path: 'title', // 검색 대상; 제목 날짜 둘다 찾으려면 ['title', 'date']
                },
            },
        },
        { $sort: { _id: 1 } }, // 정렬 1: 오름차순 -1 내림차순
        { $limit: 10 }, // 10개까지만 결과 가져옴
        { $project: { title: 1, _id: 0, score: { $meta: 'searchScore' } } }, // 가져올 것은 1, 안 가져올것은 0, score는 검색한 키워드와 관련 높아보이는걸 점수매김
    ];
    db.collection('post')
        // .find({ title: 요청.query.value }) // 문제점: 정확히 일치하는 것만 검색 가능
        // .find({ title: /쿠키/ }) // 해결방안: 이런식으로 정규식을 쓰면 됨 but find()로 다 찾는건 오래 걸림
        // .find({ $text: { $search: 요청.query.value } }) // 문제점: 검색 키워드가 정확히 일치해야함(띄어쓰기 단위로 indexing하기 때문에)
        .aggregate(검색조건)
        .toArray((에러, 결과) => {
            console.log(에러);
            console.log(결과); // [ { _id: 4, title: '쿠키숙제하기', date: '0718' } ]
            응답.render('search.ejs', { posts: 결과 });
        });
});

// Binary Search
// 미리 숫자순으로 정렬 되어있어야함 - 미리 정렬해두기(=indexing)

/* server.js에 shop.js 라우터 첨부하기 */
app.use('/shop', require('./routes/shop.js')); // '/shop' 경로로 사용자가 요청했을 때 `require('./routes/shop.js')`이런 미들웨어(= 라우터)를 적용해줌

/* 이미지 업로드 */
// multer 라이브러리 세팅
let multer = require('multer');
// diskStorage : 일반하드 <-> memoryStorage : 램(휘발성있음)
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/image');
    },
    filename: function (req, file, cb) {
        // 저장한 이미지 파일명 설정
        cb(null, file.originalname);
        // cb(null, file.originalname + '날짜~');
    },
    filefilter: function (req, file, cb) {
        // 파일 형식(확장자) 필터
        var ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
            return callback(new Error('PNG, JPG만 업로드하세요'));
        }
        callback(null, true);
    },
    limits: {
        // 파일 크기 제한
        // fileSize: 1024 * 1024,
    },
});

var upload = multer({ storage: storage }); // 미들웨어처럼 실행시키면 됨

app.get('/upload', function (요청, 응답) {
    응답.render('upload.ejs');
});

// 파일 하나 업로드
app.post('/upload', upload.single('profile'), function (요청, 응답) {
    //upload.single('input의 name 속성')
    응답.send('업로드완료');
});

// 파일 여러개 업로드
// app.post('/upload', upload.array('profile', 10), function (요청, 응답) {
//     //upload.single('input의 name 속성', 업로드 최대 갯수)
//     응답.send('업로드완료');
// });

/* 업로드한 이미지 보여주기 */
app.get('/image/:imageName', function (요청, 응답) {
    응답.sendFile(__dirname + '/public/image/' + 요청.params.imageName); // __dirname: 현재파일 경로
});
