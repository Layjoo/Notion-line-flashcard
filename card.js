// const prompt = require('prompt-sync')();
const dayjs = require('dayjs');

//////////////////////////////////////////
//initialize space-repition value
//////////////////////////////////////////
const intervalModified = 50;
const easyBonus = 3;
const startEase = 250;
const startDateInterval = 1;
const today = dayjs().format("YYYY-MM-DD").toString();

const setCardInterval  = ({card_current, card_ease, card_date}, status) => {
    let current = card_current|| startDateInterval;
    let ease = card_ease || startEase;
    let date = card_date || today

    date = dayjs(date).unix() < dayjs(today).unix() ? dayjs(today) : dayjs(date);
    let newInterval;
    let nextDay;

    //set new interval
    switch (status) {
        case "good":
            newInterval = current * (ease / 100) * (intervalModified / 100);
            nextDay = Math.ceil(newInterval)
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date = date.set('date', date.get('date') + nextDay)

            //set card
            ease = ease.toString();
            current = nextDay.toString();
            date = date.format("YYYY-MM-DD");
            break;
        case "hard":
            newInterval = current * 1.2 * (intervalModified / 100)
            nextDay = Math.ceil(newInterval)
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date = date.set('date', date.get('date') + nextDay)

            //set card
            ease = (ease - 15).toString();
            current = nextDay.toString();
            date = date.format("YYYY-MM-DD").toString();
            break;
        case "easy":
            newInterval = current * (ease / 100) * (intervalModified / 100) * easyBonus
            nextDay = Math.ceil(newInterval)
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date = date.set('date', date.get('date') + nextDay)

            //set card
            ease = (ease + 15).toString();
            current = nextDay.toString();
            date = date.format("YYYY-MM-DD").toString();
            break;
        default:
            newInterval = current * 0.5;
            nextDay = Math.ceil(newInterval)
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date = dayjs(today); //show card for today again

            //set card
            ease = (ease - 25).toString();
            current = nextDay.toString()
            date = date.format("YYYY-MM-DD").toString();
            break;
    }
    return {ease: ease, current: current, date: date};
}

module.exports = {
    setCardInterval 
}

//this is for testing
/////////////////////////

// const card = {
//     front: "What is the first alphabet in English",
//     back: "a",
//     date: "2022-05-08",
//     current: startDateInterval,
//     ease: startEase
// }

// const showCard = (card) => {
//     const front = card.front;
//     const back = card.back;

//     const status = prompt(front + ": ");
//     console.log(`Answer is: ${back}`);
//     const _card = setCardInterval (card, status);
//     return _card;
// }

// let test = true;
// let i=0;
// let mycard = card;

// while(test){
//     mycard = showCard(mycard)
//     console.log(mycard)
//     if(i==5){
//         test = false;
//     }
//     i++
// }