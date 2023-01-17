
//initialize space-repition value
const intervalModified = 50;
const easyBonus = 3;
const startEase = 250;
const startDateInterval = 1;
const today = new Date();
const thailandTimezoneOffset = 420; // offset in minutes

//function for setting new card interval
const setCardInterval = (card, status) => {
    let current = card.card_current || startDateInterval;
    let ease = card.card_ease || startEase;
    let date = card.card_date || today;

    // adjust date to Thailand timezone
    date = new Date(date.getTime() + (thailandTimezoneOffset * 60000));

    if (date < today) {
        date = today;
    }

    let newInterval;
    let nextDay;

    switch (status) {
        case "good":
            newInterval = current * (ease / 100) * (intervalModified / 100);
            nextDay = Math.ceil(newInterval);
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date.setDate(date.getDate() + nextDay);

            ease = ease.toString();
            current = nextDay.toString();
            break;
        case "hard":
            newInterval = current * 1.2 * (intervalModified / 100);
            nextDay = Math.ceil(newInterval);
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date.setDate(date.getDate() + nextDay);

            ease = (ease - 15).toString();
            current = nextDay.toString();
            break;
        case "easy":
            newInterval = current * (ease / 100) * (intervalModified / 100) * easyBonus;
            nextDay = Math.ceil(newInterval);
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date.setDate(date.getDate() + nextDay);

            ease = (ease + 15).toString();
            current = nextDay.toString();
            break;
        default:
            newInterval = current * 0.5;
            nextDay = Math.ceil(newInterval);
            nextDay < 1 ? nextDay = 1 : nextDay = nextDay;
            date = today;

            ease = (ease - 25).toString();
            current = nextDay.toString();
            break;
    }

<<<<<<< HEAD
    const formattedDate = date.toISOString().slice(0, 10);

    return { ease: ease, current: current, date: formattedDate };
};

module.exports = {
    setCardInterval
}
=======
    console.log(today)
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
>>>>>>> 1098b2702894d5558c829242e943e54b4638a632
