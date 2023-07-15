const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('vew engine', 'ejs');

var db;

const MongoClient = require('mongodb').MongoClient;
MongoClient.connect(
    'mongodb+srv://tuz22:sert1234@tuz22.gmrxoku.mongodb.net/?retryWrites=true&w=majority',
    function (에러, client) {
        // 연결되면 실행
        if (에러) return console.log(에러);

        db = client.db('todoapp'); // 데이터 저장할 폴더 명시

        // db.collection('post').insertOne({_id: 0, 이름: 'Kim', 나이: 20}, function(에러, 결과){ // 저장할 데이터는 Object 자료형으로
        //     console.log('저장완료');
        // });

        app.listen(8080, function () {
            // listen(서버 띄울 포트번호, 띄운 후 실행할 코드)
            console.log('listening on 8080');
        }); // 서버를 띄우기 위한 기본 세팅
    }
);

/* get 요청 */
// app.get('/pet', (요청, 응답) => {});
app.get('/pet', function (요청, 응답) {
    //  req, res
    응답.send('펫용품 쇼핑 페이지 입니다.');
});

/* 서버에서 HTML 파일 전송 */
app.get('/', function (요청, 응답) {
    //  req, res
    응답.sendFile(__dirname + '/index.html');
});

app.get('/write', function (요청, 응답) {
    응답.sendFile(__dirname + '/write.html');
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
