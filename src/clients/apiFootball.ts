export class APIFootball {
  protected apiKey: string
  protected baseUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseUrl = 'https://v3.football.api-sports.io'
  }

  async getLineups(fixtureId: string) {
    const url = `${this.baseUrl}/fixtures/lineups?fixture${fixtureId}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-apisports-key': this.apiKey,
      },
    })
  }
}
