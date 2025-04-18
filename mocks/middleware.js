const db = require('./db.json');
module.exports = (req, res, next) => {
  switch (req.path) {
    case '/questions':
      getQuestions(req, res, next);
      break;
    case '/submissionsß':
      getSubmissions(req, res, next);
      break;
    case '/error':
      respondError(req, res);
      break;
    default:
      setTimeout(next, getRandomTimeout(1, 3));
  }

  function getQuestions(req, res, next) {
    const questions = db.questions;
    setTimeout(() => {
      res.json(input ? questions : []);
    }, 20);
  }

  function getSubmissions(req, res, next) {
    const submissions = db.submissions;
    setTimeout(() => {
      res.json(input ? submissions : []);
    }, 20);
  }

  function respondError(req, res) {
    res.status(500).jsonp({ error: 'Internal Server Error', message: 'Error Occurred' });
  }

  function getRandomTimeout(minSecond, maxSecond) {
    minSecond = Math.ceil(minSecond);
    maxSecond = Math.floor(maxSecond);
    return (Math.floor(Math.random() * (maxSecond - minSecond + 1)) + minSecond) * 1000;
  }
};
