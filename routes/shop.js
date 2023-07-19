var router = require('express').Router(); // npm으로 설치한 express 라이브러리의 Router()란 함수 사용

// 페이지 이동 전 실행할 미들웨어
function 로그인했니(요청, 응답, next) {
    if (요청.user) {
        next();
    } else {
        응답.send('로그인안함');
    }
}

// 일일이 적용하면 번거로움) router.get('/shirts', 로그인했니, function (요청, 응답) {
/* 특정 라우터 파일에 미들웨어 적용 */
router.use(로그인했니);

/* 특정 URL에만 미들웨어 적용 */
// router.use('/shirts', 로그인했니);

router.get('/shirts', function (요청, 응답) {
    응답.send('셔츠 파는 페이지입니다.');
});
router.get('/pants', function (요청, 응답) {
    응답.send('바지 파는 페이지입니다.');
});

// 자바스크립트 파일을 다른 파일에서 사용하고 싶을 때
module.exports = router;
