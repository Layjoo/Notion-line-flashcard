
//initialize space-repition value
const intervalModified = 50;
const easyBonus = 3;
const startEase = 250;
const startDateInterval = 1;
const thailandTimezoneOffset = 420; // offset in minutes

//set today date using thailand timezone instead of any server timezone
const getCurrentTime = () => {
    let today = new Date();
    const offset = 420; // offset in minutes for "Asia/Bangkok" timezone
    const bangkokTime = new Date(today.getTime() + offset * 60000);
    return bangkokTime
}

//function for setting new card interval
const setCardInterval = ({card_current, card_ease, card_date}, status) => {
    const today = getCurrentTime();
    let current = card_current || startDateInterval;
    let ease = card_ease || startEase;
    let date = new Date(card_date) || today;

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

    const formattedDate = date.toISOString().slice(0, 10);

    return { ease: ease, current: current, date: formattedDate };
};

module.exports = {
    setCardInterval
}
