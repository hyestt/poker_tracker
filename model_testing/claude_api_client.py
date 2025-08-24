#!/usr/bin/env python3
"""
Claude 4 API 客戶端腳本
讀取 system_prompt.txt 和 user_prompt.json，呼叫 Claude 4 API 產生回應

使用方法:
python claude_api_client.py [--model MODEL_NAME] [--language LANGUAGE] [--hand-details "手牌詳情"]

環境變數:
ANTHROPIC_API_KEY - Claude API 金鑰
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


class ClaudeAPIClient:
    """Claude API 客戶端類別"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        初始化 Claude API 客戶端
        
        Args:
            api_key: Claude API 金鑰，如果未提供則從環境變數讀取
        """
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        if not self.api_key:
            raise ValueError("未找到 Claude API 金鑰。請設定 ANTHROPIC_API_KEY 環境變數或傳入 api_key 參數")
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.project_root = Path(__file__).parent
        self.prompts_dir = self.project_root / "be_poker" / "prompts"
    
    def read_system_prompt(self) -> str:
        """
        讀取 system prompt 檔案
        
        Returns:
            system prompt 內容
        """
        system_prompt_path = self.prompts_dir / "system_prompt_2.txt"
        
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
        user_prompt_path = self.prompts_dir / "user_prompt_2.json"
        
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
        處理 user prompt 模板，替換變數
        
        Args:
            template: user prompt JSON 模板
            language: 分析語言
            hand_details: 手牌詳情
            **kwargs: 其他模板變數
            
        Returns:
            處理後的 user prompt JSON 字串
        """
        # 預設值
        defaults = {
            "LANGUAGE": language,
            "HAND_DETAILS": hand_details,
            "SMALL_BLIND": "1",
            "BIG_BLIND": "2", 
            "HERO_POSITION": "BTN",
            "HERO_HOLE_CARDS": "AsKs",
            "VILLAIN_ID": "V1",
            "VILLAIN_POSITION": "BB",
            "VILLAIN_HOLE_CARDS": "unknown",
            "FLOP_CARDS": "AhKdQc",
            "TURN_CARD": "7s",
            "RIVER_CARD": "2h",
            "HAND_NOTES": "Standard hand analysis"
        }
        
        # 合併用戶提供的參數
        defaults.update(kwargs)
        
        # 將模板轉為 JSON 字串
        template_str = json.dumps(template, ensure_ascii=False, indent=2)
        
        # 替換所有模板變數
        for key, value in defaults.items():
            placeholder = f"{{{{{key}}}}}"
            template_str = template_str.replace(placeholder, str(value))
        
        return template_str
    
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
    
    def call_claude_api(self, 
                       system_prompt: str, 
                       user_prompt: str,
                       model: str = "claude-sonnet-4-20250514",
                       max_tokens: int = 1800) -> str:
        """
        呼叫 Claude API
        
        Args:
            system_prompt: 系統提示
            user_prompt: 用戶提示
            model: Claude 模型名稱
            max_tokens: 最大 token 數
            
        Returns:
            Claude API 回應
        """
        try:
            response = self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                system=system_prompt,
                temperature=0.3,
                messages=[
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ]
            )
            
            return response.content[0].text
            
        except Exception as e:
            raise RuntimeError(f"Claude API 呼叫失敗: {str(e)}")
    
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
            model: Claude 模型
            use_hand_history: 是否使用 hand_history.txt 檔案
            **prompt_vars: 其他 prompt 變數
            
        Returns:
            Claude 分析結果
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
            else:
                print(f"⚠️  hand_history.txt 檔案不存在或為空，使用預設手牌詳情")
        
        # 處理 user prompt
        user_prompt = self.process_user_prompt(
            user_prompt_template, 
            language=language,
            hand_details=hand_details,
            **prompt_vars
        )
        
        print(f"🔄 呼叫 Claude API (模型: {model})...")
        
        # 呼叫 API
        response = self.call_claude_api(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=model
        )
        
        print(f"✅ 成功獲得 Claude 回應 ({len(response)} 字元)")
        
        return response


def main():
    """主程式"""
    parser = argparse.ArgumentParser(description="Claude 4 API 客戶端 - 撲克手牌分析")
    parser.add_argument("--model", 
                       default="claude-sonnet-4-20250514",
                       help="Claude 模型名稱 (預設: claude-sonnet-4-20250514)")
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
        client = ClaudeAPIClient()
        
        print("🚀 Claude 4 API 撲克分析客戶端")
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
        
        print("\n📊 Claude 分析結果:")
        print("=" * 50)
        print(response)
        
        # 儲存到檔案 (可選)
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(response)
            print(f"\n💾 結果已儲存到: {args.output}")
            
    except Exception as e:
        print(f"❌ 錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
