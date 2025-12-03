/**
 * Unit Tests for X/Twitter Mass Unfollow Script
 * @jest-environment jsdom
 */

import { sleep, randomDelay, txt, isMutual, getUsername, findUnfollowButton } from '../src/unfollow';

describe('Utility Functions', () => {
  
  describe('sleep', () => {
    it('should resolve after specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(95);
      expect(elapsed).toBeLessThan(200);
    });

    it('should return a Promise', () => {
      const result = sleep(10);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('randomDelay', () => {
    it('should return a number within the default range', () => {
      const delay = randomDelay(1000, 2000);
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThan(2000);
    });

    it('should return different values on multiple calls (randomness)', () => {
      const delays = new Set<number>();
      for (let i = 0; i < 10; i++) {
        delays.add(randomDelay(1000, 10000));
      }
      // With a large range, we expect at least some variation
      expect(delays.size).toBeGreaterThan(1);
    });

    it('should return min value when min equals max', () => {
      const delay = randomDelay(5000, 5000);
      expect(delay).toBe(5000);
    });
  });

  describe('txt', () => {
    it('should return lowercase trimmed text from innerText', () => {
      const el = document.createElement('div');
      el.innerText = '  Hello World  ';
      expect(txt(el)).toBe('hello world');
    });

    it('should return lowercase trimmed text from textContent', () => {
      const el = document.createElement('span');
      el.textContent = '  FOLLOWING  ';
      expect(txt(el)).toBe('following');
    });

    it('should return empty string for null element', () => {
      expect(txt(null)).toBe('');
    });

    it('should return empty string for element with no text', () => {
      const el = document.createElement('div');
      expect(txt(el)).toBe('');
    });
  });

  describe('isMutual', () => {
    it('should return true when cell contains "follows you"', () => {
      const cell = document.createElement('div');
      cell.innerText = 'John Doe Follows you';
      expect(isMutual(cell)).toBe(true);
    });

    it('should return true for Persian "follows you" text', () => {
      const cell = document.createElement('div');
      cell.innerText = 'شما را دنبال می‌کند';
      expect(isMutual(cell)).toBe(true);
    });

    it('should return false when cell does not contain mutual indicator', () => {
      const cell = document.createElement('div');
      cell.innerText = 'John Doe @johndoe';
      expect(isMutual(cell)).toBe(false);
    });

    it('should be case insensitive', () => {
      const cell = document.createElement('div');
      cell.innerText = 'FOLLOWS YOU';
      expect(isMutual(cell)).toBe(true);
    });
  });

  describe('getUsername', () => {
    it('should extract username from link href', () => {
      const cell = document.createElement('div');
      const link = document.createElement('a');
      link.href = '/johndoe';
      link.setAttribute('role', 'link');
      cell.appendChild(link);
      expect(getUsername(cell)).toBe('johndoe');
    });

    it('should return "unknown" when no link found', () => {
      const cell = document.createElement('div');
      cell.innerText = 'No links here';
      expect(getUsername(cell)).toBe('unknown');
    });

    it('should ignore status links', () => {
      const cell = document.createElement('div');
      const link = document.createElement('a');
      link.href = '/johndoe/status/123456';
      cell.appendChild(link);
      // Since this contains "status", it should be ignored
      expect(getUsername(cell)).toBe('unknown');
    });

    it('should ignore intent links', () => {
      const cell = document.createElement('div');
      const link = document.createElement('a');
      link.href = '/intent/follow';
      cell.appendChild(link);
      expect(getUsername(cell)).toBe('unknown');
    });
  });

  describe('findUnfollowButton', () => {
    it('should find button with "following" text', () => {
      const cell = document.createElement('div');
      const btn = document.createElement('button');
      btn.innerText = 'Following';
      cell.appendChild(btn);
      expect(findUnfollowButton(cell)).toBe(btn);
    });

    it('should find button with "unfollow" text', () => {
      const cell = document.createElement('div');
      const btn = document.createElement('div');
      btn.setAttribute('role', 'button');
      btn.innerText = 'Unfollow';
      cell.appendChild(btn);
      expect(findUnfollowButton(cell)).toBe(btn);
    });

    it('should find button with Persian text', () => {
      const cell = document.createElement('div');
      const btn = document.createElement('button');
      btn.innerText = 'دنبال می‌کنید';
      cell.appendChild(btn);
      expect(findUnfollowButton(cell)).toBe(btn);
    });

    it('should return undefined when no unfollow button found', () => {
      const cell = document.createElement('div');
      const btn = document.createElement('button');
      btn.innerText = 'Follow';
      cell.appendChild(btn);
      expect(findUnfollowButton(cell)).toBeUndefined();
    });

    it('should be case insensitive', () => {
      const cell = document.createElement('div');
      const btn = document.createElement('button');
      btn.innerText = 'FOLLOWING';
      cell.appendChild(btn);
      expect(findUnfollowButton(cell)).toBe(btn);
    });
  });
});

describe('Integration Tests', () => {
  
  beforeEach(() => {
    // Reset DOM before each test
    document.body.innerHTML = '';
  });

  it('should correctly identify a non-mutual follower cell', () => {
    const cell = document.createElement('div');
    cell.setAttribute('data-testid', 'UserCell');
    
    const link = document.createElement('a');
    link.href = '/testuser';
    link.setAttribute('role', 'link');
    link.innerText = '@testuser';
    
    const btn = document.createElement('div');
    btn.setAttribute('role', 'button');
    btn.innerText = 'Following';
    
    cell.appendChild(link);
    cell.appendChild(btn);
    
    expect(isMutual(cell)).toBe(false);
    expect(getUsername(cell)).toBe('testuser');
    expect(findUnfollowButton(cell)).toBe(btn);
  });

  it('should correctly identify a mutual follower cell', () => {
    const cell = document.createElement('div');
    cell.setAttribute('data-testid', 'UserCell');
    
    const link = document.createElement('a');
    link.href = '/mutualuser';
    link.setAttribute('role', 'link');
    
    const followsYou = document.createElement('span');
    followsYou.innerText = 'Follows you';
    
    cell.appendChild(link);
    cell.appendChild(followsYou);
    
    expect(isMutual(cell)).toBe(true);
    expect(getUsername(cell)).toBe('mutualuser');
  });
});

describe('Edge Cases', () => {
  
  it('should handle empty cells gracefully', () => {
    const cell = document.createElement('div');
    expect(isMutual(cell)).toBe(false);
    expect(getUsername(cell)).toBe('unknown');
    expect(findUnfollowButton(cell)).toBeUndefined();
  });

  it('should handle cells with multiple buttons', () => {
    const cell = document.createElement('div');
    
    const btn1 = document.createElement('button');
    btn1.innerText = 'Message';
    
    const btn2 = document.createElement('button');
    btn2.innerText = 'Following';
    
    const btn3 = document.createElement('button');
    btn3.innerText = 'More';
    
    cell.appendChild(btn1);
    cell.appendChild(btn2);
    cell.appendChild(btn3);
    
    expect(findUnfollowButton(cell)).toBe(btn2);
  });

  it('should handle special characters in usernames', () => {
    const cell = document.createElement('div');
    const link = document.createElement('a');
    link.href = '/user_123_test';
    link.setAttribute('role', 'link');
    cell.appendChild(link);
    expect(getUsername(cell)).toBe('user_123_test');
  });
});
