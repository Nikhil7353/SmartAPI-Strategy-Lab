import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer

class MarketDataConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = 'market_quotes'
        self.room_group_name = f'quotes_{self.room_name}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Send initial connected ack
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to NiK Trade Desk Real-time Streamer'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'subscribe':
            tokens = data.get('tokens', [])
            await self.send(text_data=json.dumps({
                'type': 'subscribed',
                'tokens': tokens
            }))

    async def market_quote_update(self, event):
        # Broadcast quote update to connected client
        await self.send(text_data=json.dumps(event['data']))
