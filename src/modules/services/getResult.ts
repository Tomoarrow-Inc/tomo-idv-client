import { config } from "../ClientEnv";

export const getResult = async (session_id: string) => {
    return await fetch(config.resultsEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id })
    })
        .then(res => res.json())
        .then(data => {
            console.log(JSON.stringify(data, null, 2));
            return data;
        })
        .catch(err => {
            console.error(err);
        });
}