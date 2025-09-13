// Para usar esse codigo é nescessario estar rodando https://github.com/ZFC-Digital/cf-clearance-scraper



const { Worker, isMainThread, parentPort } = require("worker_threads");
const axios = require("axios");

let successfulVotes = 0;


if (isMainThread) {
  for (let i = 0; i < 10; i++) {
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
      const response = await axios.post("http://localhost:3000/cf-clearance-scraper", {
        url: "https://peb.gg/votacoes/indicacao_publica/",
        siteKey: "0x4AAAAAAA1JeTFYlficqvE4",
        mode: "turnstile-min",
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.token) {
        return response.data.token;
      } else {
        throw new Error("Captcha token not received.");
      }
    } catch (error) {
      console.error(`Error solving CAPTCHA: ${error.message}`);
      throw error;
    }
  }

  async function sendVote() {
    try {
      const getResponse = await axios.get("https://peb.gg/votacoes/indicacao_publica/", {
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
          "Message":"EDUCATIONAL PROPOSALS ONLY MADE BY https://github.com/pedrin0x10/PEB-Bot",
        },
      });

      const captchaToken = await solveCaptcha();
      const cookies = getResponse.headers["set-cookie"]?.map((cookie) => cookie.split(";")[0]).join("; ");

      const csrfmiddlewaretokenMatch = getResponse.data.match(/<input type="hidden" name="csrfmiddlewaretoken" value="(.*?)"/);
      if (!csrfmiddlewaretokenMatch) {
        throw new Error("CSRF token not found in GET response");
      }

      const csrfmiddlewaretoken = csrfmiddlewaretokenMatch[1];
      const nome = generateRandomName();
      const email = generateRandomEmail();
      const telefone = generateRandomPhoneNumber();

      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "https://peb.gg/votacoes/indicacao_publica/",
        cookie: cookies,
      };

      const data = `csrfmiddlewaretoken=${csrfmiddlewaretoken}&valor-indicado-20=KSCERATO&valor-indicado-19=JonVlogs&valor-indicado-31=ProbIems&valor-indicado-32=Nicole+Diretora&valor-indicado-2=snowzin&valor-indicado-3=Nandaa&valor-indicado-4=Rang13&valor-indicado-5=Phzin&valor-indicado-6=Noda&valor-indicado-7=Lucasxgamer&valor-indicado-8=Jojo&valor-indicado-9=Paluh&valor-indicado-10=KJ&valor-indicado-11=Poppins&valor-indicado-12=bizerra&valor-indicado-13=Angeliss&valor-indicado-14=Alpha7&valor-indicado-15=Mobile+Legends&valor-indicado-16=JMDECK&valor-indicado-17=XRM&valor-indicado-18=Baiano&valor-indicado-21=Lukxo&valor-indicado-22=Henrykinho&valor-indicado-23=Lins7&valor-indicado-28=Cabel%C3%A3o+Jeimes&valor-indicado-30=Influence+Rage+-+PUBG+Mobile&nome=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&telefone=${telefone}&cf-turnstile-response=${captchaToken}`;

      const postResponse = await axios.post("https://peb.gg/votacoes/indicacao_publica/", data, { headers });

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
