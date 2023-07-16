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

/* post 요청 */
app.post('/add', function (요청, 응답) {
    // input에 적은 정보는 '요청'에 저장되어있음. 쉽게 사용하려면 라이브러리(body-parser) 필요
    응답.send('전송완료');

    // 1. DB.collection 내의 총 게시물갯수를 찾음
    db.collection('counter').findOne({ name: '게시물갯수' }, function (에러, 결과) {
        console.log(결과.totalPost);

        // 2. 총 게시물갯수를 변수에 저장
        var 총게시물갯수 = 결과.totalPost;

        // 3. DB.collection에 새 게시물을 기록
        db.collection('post').insertOne(
            { _id: 총게시물갯수 + 1, title: 요청.body.title, date: 요청.body.date },
            function (에러, 결과) {
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
            }
        );

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

/* DB에서 데이터 삭제하기 */
app.delete('/delete', function (요청, 응답) {
    console.log(요청.body); // 요청시 함께 보낸 데이터를 찾기(게시글 번호)
    요청.body._id = parseInt(요청.body._id); // 문자가 된 id값을 다시 숫자로 변환

    // db.collection('post').deleteOne({삭제할 항목}, function(){
    db.collection('post').deleteOne(요청.body, function (에러, 결과) {
        console.log('삭제완료');
        응답.status(200).send({ message: '성공' });
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
