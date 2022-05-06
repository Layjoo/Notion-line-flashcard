var prompt = require('prompt-sync')();

const notionDate = (date) => {
    const localDate = date.toLocaleString('en-US', 
    {
        timezone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
    const [m, d, y] = localDate.split('/');
    const notionDateStyle = `${y}-${m}-${d}`

    return notionDateStyle
}

const intervalModified = 50;
const easyBonus = 3;
const startEase = 250;
const startDateInterval = 1;

const setNewInterval = (card, status) => {
    const modifiedCard = JSON.parse(JSON.stringify(card));
    const current = parseInt(modifiedCard.current) || startDateInterval;
    const ease = parseInt(modifiedCard.ease) || startEase;

    const today = new Date(Date.now());
    let date = modifiedCard.date || today;
    date = new Date(date)
    date = date.getTime() < today.getTime() ? today : date;
    let newInterval;
    let nextDay;

    //setNewInterval
    switch (status) {
        case "good":
            newInterval = current * (ease / 100) * (intervalModified / 100);
            nextDay = Math.ceil(newInterval)
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date.setDate(date.getDate() + nextDay);

            //set card
            modifiedCard.ease = ease.toString();
            modifiedCard.current = nextDay.toString();
            modifiedCard.date = notionDate(date);
            break;
        case "hard":
            newInterval = current * 1.2 * (intervalModified / 100)
            nextDay = Math.ceil(newInterval)
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date.setDate(date.getDate() + nextDay);

            //set card
            modifiedCard.ease = (ease - 15).toString();
            modifiedCard.current = nextDay.toString();
            modifiedCard.date = notionDate(date);
            break;
        case "easy":
            newInterval = current * (ease / 100) * (intervalModified / 100) * easyBonus
            nextDay = Math.ceil(newInterval)
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date.setDate(date.getDate() + nextDay);

            //set card
            modifiedCard.ease = (ease + 15).toString();
            modifiedCard.current = nextDay.toString();
            modifiedCard.date = notionDate(date);
            break;
        default:
            newInterval = current * 0.5;
            nextDay = Math.ceil(newInterval)
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date = today; //show card for today again

            //set card
            modifiedCard.ease = (ease - 25).toString();
            modifiedCard.current = nextDay.toString()
            modifiedCard.date = notionDate(date);
            break;
    }
    return modifiedCard;
}

module.exports = {
    setNewInterval
}

///this is for testing
///////////////////////////

// const card = {
//     front: "What is the first alphabet in English",
//     back: "a",
//     date: "",
//     current: startDateInterval,
//     ease: startEase
// }

// const showCard = (card) => {
//     const front = card.front;
//     const back = card.back;

//     const status = prompt(front + ": ");
//     console.log(`Answer is: ${back}`);
//     const _card = setNewInterval(card, status);
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