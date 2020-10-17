import { eventDispatch } from './request/dispatch'

addEventListener('fetch', event => {
 event.respondWith(eventDispatch(event))
})
