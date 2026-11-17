import { describe, expect, it } from 'vitest'
import { urlMediaSure } from './urlMedia.js'

describe('urlMediaSure', () => {
  it('garde les adresses de medias attendues', () => {
    for (const u of ['blob:http://localhost:5181/abc', '/api/v1/photos/x.jpg#c=50,30', '/api/v1/videos/v.mp4', '/images/a.jpg', 'https://cdn.exemple.sn/a.jpg']) {
      expect(urlMediaSure(u)).toBe(u)
    }
  })
  it('refuse le reste', () => {
    for (const u of ['javascript:alert(1)', 'data:text/html,<b>', 'http://x.sn/a.jpg', '//x.sn/a.jpg', null, undefined]) {
      expect(urlMediaSure(u)).toBe('')
    }
  })
})
