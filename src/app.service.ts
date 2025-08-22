import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { AxiosBasicCredentials } from 'axios';
import { firstValueFrom } from 'rxjs';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class AppService {
  private readonly log = new Logger(AppService.name);
  private ovhDynDNSUrl = 'https://dns.eu.ovhapis.com/nic/update?system=dyndns';
  private ovhHostname: string;
  private ovhAuth: AxiosBasicCredentials;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ovhHostname = this.configService.get<string>(
      'OVH_HOSTNAME',
      'localhost',
    );
    this.ovhAuth = {
      username: this.configService.get<string>('OVH_SUBDOMAIN', ''),
      password: this.configService.get<string>('OVH_PASSWORD', ''),
    };
  }

  @Cron(process.env.CRON_INTERVAL ?? '0 */1 * * *')
  async checkOwnIp() {
    const extIP = this.match2(
      await this.myip(),
      await this.myexternalip(),
      await this.ipify()
    );

    if (!extIP) {
      this.log.debug(`Unclear state. No matching IPs`);
      return;
    }
    
    this.log.debug(`My current IP is: ${extIP}`);

    const updateUrl = `${this.ovhDynDNSUrl}&hostname=${this.ovhHostname}&myip=${extIP}`;
    await firstValueFrom(
      this.httpService.get(updateUrl, { auth: this.ovhAuth }),
    );
  }

  private async myexternalip(): Promise<string> {
    const url = 'http://myexternalip.com/raw';
    const data = (await this.getData(url)) as string;
    return data;
  }

  private async myip(): Promise<string> {
    const url = 'https://4.myip.is/';

    type myIpType = {
      ip: string;
      host: string;
    };
    const data: myIpType = (await this.getData(url)) as myIpType;

    return data.ip;
  }

  private async ipify(): Promise<string> {
    const url = 'https://api.ipify.org?format=json';
    type ipifyType = {
      ip: string
    }
    const data: ipifyType= (await this.getData(url)) as ipifyType;
    
    return data.ip;
  }

  private async getData(url: string): Promise<unknown> {
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data as object;
  }

  private match2(a: string, b: string, c: string): string | null {
    if (a === b || a === c) {
      return a; 
    }

    if (b === c) {
      return b; 
    }

    return null;
  }
}
