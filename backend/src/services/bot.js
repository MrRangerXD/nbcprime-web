import axios from 'axios';
import { env } from '../config/env.js';

const client = axios.create({
  baseURL: env.BOT_API_URL,
  timeout: 15000,
  headers: { 'X-API-Key': env.BOT_API_KEY },
});

export async function botGet(path, params) {
  const { data } = await client.get(path, { params });
  return data;
}

export async function botPost(path, body) {
  const { data } = await client.post(path, body);
  return data;
}

export async function botDelete(path) {
  const { data } = await client.delete(path);
  return data;
}

export const BotDown = (e) =>
  e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT' || e.code === 'ECONNABORTED';
