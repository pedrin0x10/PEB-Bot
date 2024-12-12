const { Worker, isMainThread, parentPort } = require("worker_threads");
const axios = require("axios");

let successfulVotes = 0;

const CAPMONSTER_API_KEY = "CAPMONSTER_API_KEY"; // API KEY DO https://capmonster.cloud/
const CAPTCHA_SITE_URL = "https://peb.gg/votacoes/indicacao_publica/";
const CAPTCHA_SITE_KEY = "0x4AAAAAAA1JeTFYlficqvE4"; //Cloudflare Captcha Key (class="cf-turnstile" data-sitekey=) NÃO ALTERAR ESSA KEY, APENAS SE TIVER MUDADO NA RESPOSTA DO CAPTCHA_SITE_URL

if (isMainThread) {
  for (let i = 0; i < 20; i++) {
    const worker = new Worker(__filename);
    worker.on("message", (message) => {
      if (message === "vote_success") {
        successfulVotes++;
        console.log(`Total successful votes: ${successfulVotes}`);
      }
    });
  }
} else {
  function generateRandomPhoneNumber() {
    const ddds = ["11", "12", "13", "14", "15", "16", "17", "18", "19", "21", "22", "24", "27", "28", "31", "32", "33", "34", "35", "37", "38", "41", "42", "43", "44", "45", "46", "47", "48", "49", "51", "53", "54", "55", "61", "62", "63", "64", "65", "66", "67", "68", "69", "71", "73", "74", "75", "77", "79", "81", "82", "83", "84", "85", "86", "87", "88", "89", "91", "92", "93", "94", "95", "96", "97", "98", "99"];
    const prefix = ddds[Math.floor(Math.random() * ddds.length)];
    return prefix + Math.floor(Math.random() * 900000000 + 100000000).toString();
  }

  function generateRandomEmail() {
    const names = ["brunomartins", "clarasantos", "felipemachado", "juliasouza", "ricardoribeiro", "gustavoalves", "marciagoncalves", "tiagomoreira", "raquelteixeira", "fabiosouza", "patriciabarbosa", "rodrigopereira", "danielafreitas", "fernandocosta", "giselefarias", "leonardovieira", "marianapinheiro", "rafaelafonseca", "vitorcorrea", "alinepires"];
    const domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    return `${randomName}${Math.floor(Math.random() * 100)}@${randomDomain}`;
  }

  function generateRandomName() {
    const firstNames = ["Bruno", "Clara", "Felipe", "Julia", "Ricardo", "Gustavo", "Marcia", "Tiago", "Raquel", "Fabio", "Patricia", "Rodrigo", "Daniela", "Fernando", "Gisele", "Leonardo", "Mariana", "Rafaela", "Vitor", "Aline"];
    const lastNames = ["Martins", "Santos", "Machado", "Souza", "Ribeiro", "Alves", "Gonçalves", "Moreira", "Teixeira", "Barbosa", "Pereira", "Freitas", "Costa", "Farias", "Vieira", "Pinheiro", "Fonseca", "Correa", "Pires", "Lopes"];
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${randomFirstName} ${randomLastName}`;
  }

  async function solveCaptcha() {
    try {
      const createTaskResponse = await axios.post("https://api.capmonster.cloud/createTask", {
        clientKey: CAPMONSTER_API_KEY,
        task: {
          type: "TurnstileTask",
          websiteURL: CAPTCHA_SITE_URL,
          websiteKey: CAPTCHA_SITE_KEY,
          cloudflareTaskType: "token",
          userAgent:"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"
        },
      });

      const taskId = createTaskResponse.data.taskId;
      if (!taskId) throw new Error("Failed to create CAPTCHA task");

      let solution = null;
      while (!solution) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        const getTaskResultResponse = await axios.post("https://api.capmonster.cloud/getTaskResult", {
          clientKey: CAPMONSTER_API_KEY,
          taskId,
        });

        if (getTaskResultResponse.data.status === "ready") {
          solution = getTaskResultResponse.data.solution.token;
        }
      }
      return solution;
    } catch (error) {
      console.error(`Error solving CAPTCHA: ${error.message}`);
      throw error;
    }
  }

  async function sendVote() {
    try {

      const getResponse = await axios.get(CAPTCHA_SITE_URL, {
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
          "accept-language": "pt-BR,pt;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
          "cache-control": "max-age=0",
          "upgrade-insecure-requests": "1",
        },
      });
      const captchaToken = await solveCaptcha();
      const cookies = getResponse.headers["set-cookie"].map((cookie) => cookie.split(";")[0]).join("; ");

      const csrfmiddlewaretokenMatch = getResponse.data.match(/<input type="hidden" name="csrfmiddlewaretoken" value="(.*?)"/);
      if (!csrfmiddlewaretokenMatch) {
        throw new Error("CSRF token not found in GET response");
      }
      const csrfmiddlewaretoken = csrfmiddlewaretokenMatch[1];
      const nome = generateRandomName();
      const email = generateRandomEmail();
      const telefone = generateRandomPhoneNumber();

      const headers = {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-encoding": "gzip, deflate, br, zstd",
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
        "accept-language": "pt-BR,pt;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "cache-control": "max-age=0",
        "content-type": "application/x-www-form-urlencoded",
        priority: "u=0, i",
        "sec-ch-ua":'"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        Referer: CAPTCHA_SITE_URL,
        "Origin": "https://peb.gg",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        cookie: cookies,
        "Referrer-Policy": "same-origin"
      };

      const data = `csrfmiddlewaretoken=${csrfmiddlewaretoken}&valor-indicado-20=&valor-indicado-19=Paulinho+O+Loko&nome=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&telefone=${telefone}&cf-turnstile-response=${captchaToken}`;

      const postResponse = await axios.post(CAPTCHA_SITE_URL, data, { headers });

      if (postResponse.data.includes("OBRIGADO, SEU VOTO FOI VALIDADO!")) {
        console.log(`Vote sent successfully! cf-turnstile-response=${captchaToken} csrfmiddlewaretoken=${csrfmiddlewaretoken}`);
        parentPort.postMessage("vote_success");
      } else {
        console.error("Vote submission failed. Validation message not found.");
      }
        
    } catch (error) {
      console.error(`Error sending vote: ${error.message}`);
    }
  }

  async function loopSendVote() {
    while (true) {
      await sendVote();
    }
  }

  loopSendVote();
}
