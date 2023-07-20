import CryptoJS from 'crypto-js';

// Function to authenticate with the /auth endpoint
async function loginAndGetHeader(username: string, password: string): Promise<RequestInit> {
  // Information about how to login to the iRacing /data API here: https://forums.iracing.com/discussion/15068/general-availability-of-data-api/p1
  const hash = CryptoJS.SHA256(password + username.toLowerCase());
  const hashInBase64 = CryptoJS.enc.Base64.stringify(hash);

  // Originally from here: https://stackoverflow.com/a/55680330
  // Modified through this: https://stackoverflow.com/a/49482311
  const parseCookies = (response: Response): string => {
    const raw = response.headers.get('set-cookie').split(',');
    return raw.map((entry) => {
      const parts = entry.split(';');
      const cookiePart = parts[0];
      return cookiePart;
    }).join(';');
  }

  const rawCookies = await fetch(
    'https://members-ng.iracing.com/auth',
    {
      method: 'POST',
      body: JSON.stringify({
        email: username,
        password: hashInBase64
      }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );

  const parsedCookies = parseCookies(rawCookies);
  const headerWithCookies = { headers: { 'cookie': parsedCookies } };
  return headerWithCookies;
}

// Replace these with your iRacing username and password
const USERNAME = 'example@exmaple.com';
const PASSWORD = 'Password123!';

const header = await loginAndGetHeader(USERNAME, PASSWORD);

/*
The header includes the cookies returned from the authentication process,
and is required anytime you make a call to 'https://members-ng.iracing.com/data/...'

The first fetch gets you an object in the form:
  {
    link: 'https://scorpio-assets.s3.amazonaws.com/...',
    expires: '2023-07-20T21:24:49.910Z'
  }
*/
let res = await fetch('https://members-ng.iracing.com/data/track/get', header);
let resJSON = await res.json();

// Use the link from the first fetch to get the actual data. Note: the header is not required for this call
res = await fetch(resJSON.link);
resJSON = await res.json();

// Use the data
resJSON.forEach((track) => {
  let toPrint = track.track_name;
  if (track.config_name) {
    toPrint += ` - ${track.config_name}`;
  }
  console.log(toPrint);
});

// For other endpoints, see: https://forums.iracing.com/discussion/15068/general-availability-of-data-api/p1
