import { config } from "../ClientEnv";

export const verifySession = async (session_id: string) => {
  return await fetch(config.verifySessionEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ session_id })
  })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      return data;
    })
    .catch(err => {
      console.error(err);
    });
}

