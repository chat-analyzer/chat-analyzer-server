messages = require('./convert_raw_data/txtConverter')

function getActivityOverTime(messages) {
    var days = []
    var currentDate = new Date(0);

    messages.forEach(function(msg) {
        msgDate = new Date(msg.timestamp)
        msgDay = msgDate.getDate()
        msgMonth = msgDate.getMonth()
        msgYear = msgDate.getFullYear()
        msgWeekDay = msgDate.getDay()   // 0 is Sunday, 1 is Monday ...
        if (msgDay == currentDate.getDate() &&
            msgMonth == currentDate.getMonth() &&
            msgYear == currentDate.getFullYear()) {
        
            day = days.pop()
            day.total += 1
            days.push(day)
        } else {
            days.push({'dateAsList': [msgDay, msgMonth + 1, msgYear, msgWeekDay],
                        'total': 1,
                        'hours': []})
        }

        day = days.pop()
        msgHour = msgDate.getHours()
        if(msgHour == currentDate.getHours()) {
            if(day.hours.length > 0) {
                hour = day.hours.pop()
                hour.total += 1
                day.hours.push(hour)
            } else {  //neccessary because not all conversation start at 00:XX h
                day.hours.push({'hourAsInt': msgHour,
                            'total': 1})
            }
        } else {
            day.hours.push({'hourAsInt': msgHour,
                        'total': 1})
        }
        days.push(day)

        currentDate = msgDate;
    });
    return days;
}
//console.log("\n" + JSON.stringify(days, null, 2))