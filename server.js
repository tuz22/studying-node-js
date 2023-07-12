const express = require('express');
const app = express();

app.listen(8080, function(){ // listen(서버 띄울 포트번호, 띄운 후 실행할 코드)
    console.log('listening on 8080')
}); // 서버를 띄우기 위한 기본 세팅

/* get 요청 */
// app.get('/pet', (요청, 응답) => {});
app.get('/pet', function(요청, 응답){ //  req, res
    응답.send('펫용품 쇼핑 페이지 입니다.')
});


/* 서버에서 HTML 파일 전송 */
app.get('/', function(요청, 응답){ //  req, res
    응답.sendFile(__dirname + '/index.html')
});

app.get('/write', function(요청, 응답){
    응답.sendFile(__dirname + '/write.html')
});