const express = require('express');
const app = express();

app.listen(8080, function(){ // listen(서버 띄울 포트번호, 띄운 후 실행할 코드)
    console.log('listening on 8080')
}); // 서버를 띄우기 위한 기본 세팅

