import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { AxiosBasicCredentials } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  private readonly log = new Logger(AppService.name);
  private ovhDynDNSUrl = 'https://dns.eu.ovhapis.com/nic/update?system=dyndns';
  private ovhHostname;
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

  @Cron('15 */3 * * *') // every 3 hours at x:15 eg. 0:15, 3:15, ...
  async checkOwnIp() {
    const ip1 = await this.myip();
    const ip2 = await this.myexternalip();

    if (ip1 != ip2) {
      this.log.debug(`Unclear state. IP1: ${ip1}  ---  IP2: ${ip2}`);
      return;
    }

    const extIP = ip1;
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

  private async getData(url: string): Promise<unknown> {
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data as object;
  }
}
