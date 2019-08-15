export async function postText(output: string): Promise<string> {
    const res = await (await fetch('https://txtupload.cf/api/upload',
        {
            method: 'POST',
            body: output,
            headers: {
                'Content-Type': 'text/plain'
            }
        })).json();
    return `https://txtupload.cf/${res.hash}#${res.key}`;
}