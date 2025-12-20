import asyncio
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from grouper.grouping import Grouper
from grouper.operations import get_ingredients, update_ingredient_names
from grouper.utils.logger import setup_logger


class GroupingService:
    def __init__(self, use_sqlite: bool = None):
        self.use_sqlite = use_sqlite
        self.grouper = Grouper()

        self.logger = setup_logger(__name__, "main.log")

    async def process_ingredients(self, update_db: bool = False) -> Dict[str, any]:
        """
        Process ingredients from food_db and return groupings.

        Args:
            update_db: Whether to update ingredient names in the database

        Returns:
            Dict containing:
            - groupings: Dict[str, List[str]] - ingredient categories with their ingredients
            - summary: Dict with statistics
            - flat_mapping: Dict[str, str] - ingredient to category mapping
            - updated_count: int - number of ingredients updated in database (if update_db=True)
        """
        self.logger.info("Starting ingredient grouping process...")

        groupings = await self.grouper.group_ingredients(
            save=True,
            use_sqlite=self.use_sqlite
        )

        flat_mapping = {}
        total_ingredients = 0

        for category, ingredients in groupings.items():
            for ingredient in ingredients:
                flat_mapping[ingredient] = category
                total_ingredients += 1

        summary = {
            "total_ingredients": total_ingredients,
            "total_categories": len(groupings),
            "categories": list(groupings.keys()),
            "unclassified_count": len(groupings.get("UNCLASSIFIED", []))
        }

        result = {
            "groupings": groupings,
            "summary": summary,
            "flat_mapping": flat_mapping
        }

        if update_db:
            self.logger.info("Updating ingredient names in database...")
            updated_count = await update_ingredient_names(flat_mapping, self.use_sqlite)
            result["updated_count"] = updated_count
            self.logger.info(f"Updated {updated_count} ingredient names in database")

        output_file = self.grouper.output_dir / "groupings.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        self.logger.info(f"Processed {total_ingredients} ingredients into {len(groupings)} categories")
        self.logger.info(f"Results saved to {output_file}")

        return result

    def get_ingredient_category(self, ingredient_name: str) -> str:
        """
        Get the category for a specific ingredient.

        Args:
            ingredient_name: Name of the ingredient

        Returns:
            Category name or "UNCLASSIFIED" if not found
        """
        mapping_file = self.grouper.output_dir / "groupings.json"

        if mapping_file.exists():
            with open(mapping_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data["flat_mapping"].get(ingredient_name, "UNCLASSIFIED")

        return "UNCLASSIFIED"

    async def get_ingredients_by_category(self, category: str) -> List[str]:
        """
        Get all ingredients in a specific category.

        Args:
            category: Category name

        Returns:
            List of ingredient names in the category
        """
        mapping_file = self.grouper.output_dir / "groupings.json"

        if mapping_file.exists():
            with open(mapping_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data["groupings"].get(category, [])

        return []


async def main(use_sqlite: Optional[bool] = True, update_db: bool = False):
    service = GroupingService(use_sqlite)

    return await service.process_ingredients(update_db=update_db)


def get_groupings_sync(use_sqlite: Optional[bool] = True, update_db: bool = False) -> Dict[str, any]:
    """Synchronous wrapper to get ingredient groupings."""
    service = GroupingService(use_sqlite)

    return asyncio.run(service.process_ingredients(update_db=update_db))


if __name__ == "__main__":
    asyncio.run(main(update_db=True))
