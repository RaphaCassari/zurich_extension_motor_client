import axios from "axios";
import config from "../utils/config"

const api = axios.create({
    baseURL: "",
});

export const rootCause_API = {
    get: async() => {
        const response = await api.get(`${config.HEROKU_URL}/rootcauses`);
        const { data } = response;
        return data;
    }
}