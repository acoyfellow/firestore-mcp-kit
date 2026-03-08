import { describe, expect, it } from 'vitest'

import { corePlaceholder } from './index.js'

describe('core placeholder', () => {
  it('exports the placeholder value', () => {
    expect(corePlaceholder).toBe('core')
  })
})
