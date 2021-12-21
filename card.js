const { getTodayCard } = require('./notion');

var prompt = require('prompt-sync')();
let todayObj = new Date(Date.now())
let today = todayObj.toISOString().slice(0,10);

const intervalModified = 50;
const easyBonus = 3;
const startEase = 250;
const startDateInterval = 1;

const card = {
    front: "ตัวอะไรมี 4 ขาหลังคามุงกระเบื้อง",
    back: "เต่า",
    date: today,
    current: startDateInterval,
    ease: startEase
}

const showCard = (card) => {
    const front = card.front;
    const back = card.back;

    const status = prompt(front + ": ")
    console.log(`Answer is: ${back}`)
    const _card = setNewInterval(card, status);
    return _card;
}

const setNewInterval = (card, status) => {
    const _card = JSON.parse(JSON.stringify(card));
    const current = parseInt(_card.current) || startDateInterval;
    const ease = parseInt(_card.ease) || startEase;
    let date = _card.date || today;
    date = new Date(date);
    if(date.getTime() < todayObj.getTime()){
        date = new Date(today);
    }
    let newInterval;
    let nextDay;

    //setNewInterval
    switch (status) {
        case "good":
            newInterval = current * (ease/100) * (intervalModified / 100);
            nextDay = Math.ceil(newInterval)
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date.setDate(date.getDate() + nextDay);

            //set card
            _card.ease = ease.toString();
            _card.current = nextDay.toString();
            _card.date = date.toISOString().slice(0,10);
            break;
        case "hard":
            newInterval = current * 1.2 * (intervalModified / 100)
            nextDay = Math.ceil(newInterval)
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date.setDate(date.getDate() + nextDay);

            //set card
            _card.ease = (ease-15).toString();
            _card.current = nextDay.toString();
            _card.date = date.toISOString().slice(0,10);
            break;
        case "easy":
            newInterval = current * (ease/100) * (intervalModified / 100) * easyBonus
            nextDay = Math.ceil(newInterval)
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            console.log(nextDay)
            date.setDate(date.getDate() + nextDay);

            //set card
            _card.ease = (ease + 15).toString();
            _card.current = nextDay.toString();
            _card.date = date.toISOString().slice(0,10);
            break;
        default:
            newInterval = current * 0.5;
            nextDay = Math.ceil(newInterval)
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date.setDate(date.getDate()); //show card for today again

            //set card
            _card.ease = (ease - 25).toString(); 
            _card.current = nextDay.toString()
            _card.date = date.toISOString().slice(0,10);
            break;
    }
    return _card;
}

module.exports = {
    setNewInterval
}

// test card
//////////////////
// let test = true;
// let i=0;
// let mycard = card

// while(test){
//     mycard = showCard(mycard)
//     console.log(mycard)
//     if(i==5){
//         test = false;
//     }
//     i++
// }