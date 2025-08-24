#!/usr/bin/env python3
"""
AI API 客戶端腳本 (支援 Claude 和 OpenAI)
讀取 system_prompt_2.txt 和 user_prompt_2.json，呼叫 AI API 產生回應

使用方法:
python ai_api_client.py [--model MODEL_NAME] [--language LANGUAGE] [--hand-details "手牌詳情"]

環境變數:
ANTHROPIC_API_KEY - Claude API 金鑰
OPENAI_API_KEY - OpenAI API 金鑰
"""

import os
import json
import argparse
import sys
from pathlib import Path
from typing import Dict, Any, Optional

try:
    import anthropic
except ImportError:
    print("錯誤: 請安裝 anthropic 套件")
    print("執行: pip install anthropic")
    sys.exit(1)

try:
    import openai
except ImportError:
    print("錯誤: 請安裝 openai 套件")
    print("執行: pip install openai")
    sys.exit(1)


class AIAPIClient:
    """AI API 客戶端類別 (支援 Claude 和 OpenAI)"""
    
    def __init__(self, claude_api_key: Optional[str] = None, openai_api_key: Optional[str] = None):
        """
        初始化 AI API 客戶端
        
        Args:
            claude_api_key: Claude API 金鑰，如果未提供則從環境變數讀取
            openai_api_key: OpenAI API 金鑰，如果未提供則從環境變數讀取
        """
        self.claude_api_key = claude_api_key or os.getenv('ANTHROPIC_API_KEY')
        self.openai_api_key = openai_api_key or os.getenv('OPENAI_API_KEY')
        
        # 初始化客戶端
        self.claude_client = None
        self.openai_client = None
        
        if self.claude_api_key:
            self.claude_client = anthropic.Anthropic(api_key=self.claude_api_key)
        
        if self.openai_api_key:
            self.openai_client = openai.OpenAI(api_key=self.openai_api_key)
        
        if not self.claude_client and not self.openai_client:
            raise ValueError("未找到任何 API 金鑰。請設定 ANTHROPIC_API_KEY 或 OPENAI_API_KEY 環境變數")
        
        self.project_root = Path(__file__).parent.parent  # 上一層目錄
        self.prompts_dir = self.project_root / "be_poker" / "prompts"
    
    def read_system_prompt(self) -> str:
        """
        讀取 system prompt 檔案
        
        Returns:
            system prompt 內容
        """
        primary = self.prompts_dir / "system_prompt_2.txt"
        fallback = self.prompts_dir / "system_prompt.txt"
        system_prompt_path = primary if primary.exists() else fallback
        
        if not system_prompt_path.exists():
            raise FileNotFoundError(f"找不到 system prompt 檔案: {system_prompt_path}")
        
        with open(system_prompt_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    
    def read_user_prompt_template(self) -> Dict[str, Any]:
        """
        讀取 user prompt JSON 模板
        
        Returns:
            user prompt JSON 模板
        """
        primary = self.prompts_dir / "user_prompt_2.json"
        fallback = self.prompts_dir / "user_prompt.json"
        user_prompt_path = primary if primary.exists() else fallback
        
        if not user_prompt_path.exists():
            raise FileNotFoundError(f"找不到 user prompt 檔案: {user_prompt_path}")
        
        with open(user_prompt_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def process_user_prompt(self, 
                          template: Dict[str, Any], 
                          language: str = "English",
                          hand_details: str = "No specific hand details provided",
                          **kwargs) -> str:
        """
        處理 user prompt 模板，使用與 Go 服務相同的簡化格式
        
        Args:
            template: user prompt JSON 模板 (將被忽略，使用簡化格式)
            language: 分析語言
            hand_details: 手牌詳情
            **kwargs: 其他模板變數 (將被忽略)
            
        Returns:
            處理後的 user prompt JSON 字串
        """
        # 使用與 Go 服務相同的簡化 JSON 格式
        simple_prompt = {
            "request_type": "poker_hand_analysis",
            "hand_details": hand_details,
            "language": language,
            "prompt_text": "Please analyze the following poker hand using GTO solver principles. Provide comprehensive analysis including action frequencies, ratings, and strategic recommendations for each street. Follow the format and rules specified in the system prompt."
        }
        
        return json.dumps(simple_prompt, ensure_ascii=False, indent=2)
    
    def read_hand_history(self) -> str:
        """
        讀取 hand_history.txt 檔案內容
        
        Returns:
            手牌歷史內容，如果檔案不存在則返回空字串
        """
        hand_history_path = self.project_root / "hand_history.txt"
        
        if not hand_history_path.exists():
            return ""
        
        with open(hand_history_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    
    def call_ai_api(self, 
                   system_prompt: str, 
                   user_prompt: str,
                   model: str = "claude-sonnet-4-20250514",
                   max_tokens: int = 1800) -> str:
        """
        呼叫 AI API (Claude 或 OpenAI)
        
        Args:
            system_prompt: 系統提示
            user_prompt: 用戶提示
            model: AI 模型名稱
            max_tokens: 最大 token 數
            
        Returns:
            AI API 回應
        """
        try:
            # 判斷使用哪個 API
            if model.startswith('claude'):
                if not self.claude_client:
                    raise ValueError("Claude API 金鑰未設定，無法使用 Claude 模型")
                return self._call_claude_api(system_prompt, user_prompt, model, max_tokens)
            elif model.startswith('gpt'):
                if not self.openai_client:
                    raise ValueError("OpenAI API 金鑰未設定，無法使用 OpenAI 模型")
                return self._call_openai_api(system_prompt, user_prompt, model, max_tokens)
            else:
                raise ValueError(f"不支援的模型: {model}")
                
        except Exception as e:
            raise RuntimeError(f"AI API 呼叫失敗: {str(e)}")
    
    def _call_claude_api(self, system_prompt: str, user_prompt: str, model: str, max_tokens: int) -> str:
        """呼叫 Claude API"""
        response = self.claude_client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]
        )
        return response.content[0].text
    
    def _call_openai_api(self, system_prompt: str, user_prompt: str, model: str, max_tokens: int) -> str:
        """呼叫 OpenAI API"""
        response = self.openai_client.chat.completions.create(
            model=model,
            max_tokens=max_tokens,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]
        )
        return response.choices[0].message.content
    
    def analyze_hand(self, 
                    language: str = "English",
                    hand_details: str = "No specific hand details provided",
                    model: str = "claude-sonnet-4-20250514",
                    use_hand_history: bool = False,
                    **prompt_vars) -> str:
        """
        完整的手牌分析流程
        
        Args:
            language: 分析語言
            hand_details: 手牌詳情
            model: AI 模型
            use_hand_history: 是否使用 hand_history.txt 檔案
            **prompt_vars: 其他 prompt 變數
            
        Returns:
            AI 分析結果
        """
        print(f"🔄 讀取 prompt 檔案...")
        
        # 讀取 prompts
        system_prompt = self.read_system_prompt()
        user_prompt_template = self.read_user_prompt_template()
        
        print(f"✅ 成功讀取 system prompt ({len(system_prompt)} 字元)")
        print(f"✅ 成功讀取 user prompt 模板")
        
        # 如果啟用 hand_history 功能，讀取手牌歷史
        if use_hand_history:
            hand_history_content = self.read_hand_history()
            if hand_history_content:
                hand_details = hand_history_content
                print(f"📋 成功讀取 hand_history.txt ({len(hand_history_content)} 字元)")
                print(f"🔍 手牌內容預覽: {hand_history_content[:100]}...")
            else:
                print(f"⚠️  hand_history.txt 檔案不存在或為空，使用預設手牌詳情")
        
        # 處理 user prompt
        user_prompt = self.process_user_prompt(
            user_prompt_template, 
            language=language,
            hand_details=hand_details,
            **prompt_vars
        )
        
        print(f"🔄 呼叫 AI API (模型: {model})...")
        
        # 呼叫 API
        response = self.call_ai_api(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=model
        )
        
        print(f"✅ 成功獲得 AI 回應 ({len(response)} 字元)")
        
        return response


def main():
    """主程式"""
    parser = argparse.ArgumentParser(description="AI API 客戶端 - 撲克手牌分析 (支援 Claude 和 OpenAI)")
    parser.add_argument("--model", 
                       default="claude-sonnet-4-20250514",
                       help="AI 模型名稱 (預設: claude-sonnet-4-20250514)")
    parser.add_argument("--language", 
                       default="English",
                       help="分析語言 (預設: English)")
    parser.add_argument("--hand-details", 
                       default="Standard poker hand analysis request",
                       help="手牌詳情描述")
    parser.add_argument("--use-hand-history", 
                       action="store_true",
                       help="使用 hand_history.txt 檔案中的手牌歷史進行分析")
    parser.add_argument("--hero-cards",
                       default="AsKs", 
                       help="Hero 手牌 (預設: AsKs)")
    parser.add_argument("--position",
                       default="BTN",
                       help="Hero 位置 (預設: BTN)")
    parser.add_argument("--flop",
                       default="AhKdQc",
                       help="Flop 牌面 (預設: AhKdQc)")
    parser.add_argument("--turn", 
                       default="7s",
                       help="Turn 牌 (預設: 7s)")
    parser.add_argument("--river",
                       default="2h", 
                       help="River 牌 (預設: 2h)")
    parser.add_argument("--output",
                       help="輸出檔案路徑 (可選)")
    
    args = parser.parse_args()
    
    try:
        # 建立客戶端
        client = AIAPIClient()
        
        print("🚀 AI API 撲克分析客戶端 (Claude & OpenAI)")
        print("=" * 50)
        
        # 執行分析
        response = client.analyze_hand(
            language=args.language,
            hand_details=args.hand_details,
            model=args.model,
            use_hand_history=args.use_hand_history,
            HERO_HOLE_CARDS=args.hero_cards,
            HERO_POSITION=args.position,
            FLOP_CARDS=args.flop,
            TURN_CARD=args.turn,
            RIVER_CARD=args.river
        )
        
        print("\n📊 AI 分析結果:")
        print("=" * 50)
        print(response)
        
        # 儲存到檔案 (可選)
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(response)
            print(f"\n💾 結果已儲存到: {args.output}")
        
        # 顯示使用的模型信息
        if args.model.startswith('claude'):
            print(f"\n🤖 使用模型: {args.model} (Claude)")
        elif args.model.startswith('gpt'):
            print(f"\n🤖 使用模型: {args.model} (OpenAI)")
        else:
            print(f"\n🤖 使用模型: {args.model}")
            
    except Exception as e:
        print(f"❌ 錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
