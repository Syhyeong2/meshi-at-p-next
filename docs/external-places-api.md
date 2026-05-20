# External Places API

DBに保存されている店舗情報を外部システムから取得するためのサーバー間APIです。

## Endpoint

```http
GET https://<YOUR_DOMAIN>/api/external/places
```

ローカル環境でテストする場合:

```http
GET http://localhost:3000/api/external/places
```

## Authentication

リクエストには、発行されたAPIキーをBearerトークンとして指定してください。

```http
Authorization: Bearer <API_KEY>
```

APIキーは外部に公開されないサーバー環境変数、またはSecret Managerなどに保存して使用してください。ブラウザやクライアントアプリから直接呼び出す用途では設計されていません。

## Request Example

```bash
curl -sS \
  -H "Authorization: Bearer <API_KEY>" \
  "https://<YOUR_DOMAIN>/api/external/places"
```

## Success Response

成功時は `200 OK` とともに、全店舗一覧をJSONで返します。

```json
{
  "places": [
    {
      "name": "店名",
      "category": "和食",
      "googlePlaceId": "ChIJ...",
      "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=...&query_place_id=...",
      "avgRating": 4.25,
      "reviewCount": 12,
      "tags": [
        {
          "id": "00000000-0000-0000-0000-000000000000",
          "name": "ランチ",
          "emoji": "🍴",
          "count": 8
        }
      ]
    }
  ],
  "totalCount": 1,
  "generatedAt": "2026-05-20T12:34:56.789Z"
}
```

## Response Fields

| Field         | Type   | Description                                           |
| ------------- | ------ | ----------------------------------------------------- |
| `places`      | array  | 店舗一覧です。                                        |
| `totalCount`  | number | 返却された店舗数です。                                |
| `generatedAt` | string | レスポンス生成時刻です。ISO 8601形式のUTC文字列です。 |

### Place

| Field           | Type           | Description                                                           |
| --------------- | -------------- | --------------------------------------------------------------------- |
| `name`          | string         | 店舗名です。                                                          |
| `category`      | string or null | 店舗カテゴリです。保存された値がない場合は `null` です。              |
| `googlePlaceId` | string         | Google Place IDです。                                                 |
| `googleMapsUrl` | string         | 店舗名とGoogle Place IDから構成したGoogle Mapsリンクです。            |
| `avgRating`     | number         | 保存されている平均評価です。範囲は `0` から `5` です。                |
| `reviewCount`   | number         | 保存されているレビュー数です。                                        |
| `tags`          | array          | その店舗のレビューによく付与されている上位タグ一覧です。最大5件です。 |

### Tag

| Field   | Type           | Description                                              |
| ------- | -------------- | -------------------------------------------------------- |
| `id`    | string         | タグIDです。                                             |
| `name`  | string         | タグ名です。                                             |
| `emoji` | string or null | タグの絵文字です。保存された値がない場合は `null` です。 |
| `count` | number         | そのタグがこの店舗のレビューに付与された回数です。       |

タグは `count` の降順、タグ名の昇順、タグIDの昇順で並びます。

## Error Responses

### 401 Unauthorized

APIキーが指定されていない、または正しくない場合に返されます。

```json
{
  "error": "Unauthorized"
}
```

### 500 Internal Server Error

サーバー設定の不足、またはデータ取得に失敗した場合に返されます。

```json
{
  "error": "Failed to load places."
}
```

## Notes

- このAPIはサーバー間呼び出し用です。CORSヘッダーは提供しません。
- レスポンスはページネーションなしで全店舗データを返します。
- レスポンスには `Cache-Control: no-store` ヘッダーが含まれます。
- Google Mapsリンク生成のためにGoogle APIを追加で呼び出すことはありません。
