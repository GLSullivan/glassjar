import React from 'react';
import { parseISO, isAfter, format } from 'date-fns';
import { FutureHolidays } from './../../data/FutureHolidays';

type Holiday = {
  'Holiday Name'?: string;
  'Next Five Occurrences'?: string[];
  'Failure State'?: string;
}

const getFutureHolidays = (date: string): Holiday[] => {
    // Use parseISO to convert provided date string to a Date object
    let currentDate = parseISO(date);

    return FutureHolidays.map(holiday => {
        let nextOccurrences: string[] = [];

        if (typeof holiday.next_occurrence === "string") {
            let nextOccurrence = parseISO(holiday.next_occurrence);

            // Use isAfter to check if the next occurrence is in the future
            if (isAfter(nextOccurrence, currentDate)) {
                nextOccurrences.push(format(nextOccurrence, 'yyyy-MM-dd'));
            }
        } else if (Array.isArray(holiday.next_occurrence)) {
            holiday.next_occurrence.forEach(occurrence => {
                let occurrenceDate = parseISO(occurrence);

                // Check if the occurrence is in the future and we have less than 5 dates already
                if (isAfter(occurrenceDate, currentDate) && nextOccurrences.length < 5) {
                    nextOccurrences.push(format(occurrenceDate, 'yyyy-MM-dd'));
                }
            });
        }

        if (nextOccurrences.length < 5) {
            return {
                'Failure State': `The data for ${holiday.name} does not go out far enough. Only ${nextOccurrences.length} future occurrences were found.`
            }
        }

        return {
            'Holiday Name': holiday.name,
            'Next Five Occurrences': nextOccurrences.slice(0, 5)
        };
    });
}

class MyComponent extends React.Component<{}, { holidays: Holiday[] }> {
    state = {
        holidays: [],
    }

    componentDidMount() {
        const futureHolidays = getFutureHolidays('2023-06-10');
        this.setState({ holidays: futureHolidays });
    }

    render() {
        return (
            <div>
                {this.state.holidays.map((holiday, index) => (
                    <div key={index}>
                        {holiday['Holiday Name'] && <p>{holiday['Holiday Name']}</p>}
                        {/* {holiday['Next Five Occurrences'] && <p>{holiday['Next Five Occurrences'].join(', ')}</p>} */}
                        {holiday['Next Five Occurrences'] && <p>{holiday['Next Five Occurrences']}</p>}
                        {holiday['Failure State'] && <p>{holiday['Failure State']}</p>}
                    </div>
                ))}
            </div>
        );
    }
}

export default MyComponent;
