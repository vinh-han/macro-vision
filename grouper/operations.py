import asyncio
import os
import sqlite3
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import asyncpg

from grouper.utils.logger import setup_logger

logger = setup_logger(__name__, "operations.log")

async def get_ingredients(use_sqlite: Optional[bool] = True) -> List[str]:
    """Fetch all ingredient names from food_db."""

    if use_sqlite:
        logger.info("Using SQLite database for ingredients...")
        sqlite_path = Path(__file__).parent / "sample" / "recipes.sqlite"

        if not sqlite_path.exists():
            logger.error(f"SQLite database not found at {sqlite_path}")
            logger.info("Please ensure the SQLite database exists or use PostgreSQL instead")
            return []

        try:
            conn = sqlite3.connect(sqlite_path)
            cursor = conn.cursor()

            # query = "SELECT ingredient_name FROM ingredients ORDER BY ingredient_name"
            query = "SELECT name FROM ingredients ORDER BY name"
            cursor.execute(query)
            rows = cursor.fetchall()

            ingredients = [row[0] for row in rows]
            logger.info(f"Successfully loaded {len(ingredients)} ingredients from SQLite")

            conn.close()

            return ingredients

        except Exception as e:
            logger.error(f"Error fetching ingredients from SQLite: {e}")
            return []
    else:
        logger.info("Using PostgreSQL database for ingredients...")

        connection_params = {
            'host': os.getenv('POSTGRES_HOST', 'localhost'),
            'port': int(os.getenv('POSTGRES_PORT', '5432')),
            'user': os.getenv('POSTGRES_USER', 'username'),
            'password': os.getenv('POSTGRES_PASSWORD', 'password'),
            'database': os.getenv('POSTGRES_DB', 'default_database')
        }

        try:
            conn = await asyncpg.connect(**connection_params)

            query = "SELECT ingredient_name FROM ingredients ORDER BY ingredient_name"
            rows = await conn.fetch(query)

            ingredients = [row['ingredient_name'] for row in rows]
            logger.info(f"Successfully loaded {len(ingredients)} ingredients from PostgreSQL")

            await conn.close()

            return ingredients

        except Exception as e:
            logger.error(f"Error fetching ingredients from PostgreSQL: {e}")
            return []


async def update_ingredient_names(
    flat_mapping: Dict[str, str],
    use_sqlite: Optional[bool] = True
) -> int:
    """Update ingredient names in the database based on grouping mappings by merging ingredients."""

    updated_count = 0

    if use_sqlite:
        logger.info("Updating ingredient names in SQLite database...")
        sqlite_path = Path(__file__).parent / "sample" / "recipes.sqlite"

        if not sqlite_path.exists():
            logger.error(f"SQLite database not found at {sqlite_path}")
            return 0

        try:
            conn = sqlite3.connect(sqlite_path)
            cursor = conn.cursor()

            grouped_ingredients = {}
            for original_name, grouped_name in flat_mapping.items():
                if original_name != grouped_name:
                    if grouped_name not in grouped_ingredients:
                        grouped_ingredients[grouped_name] = []
                    grouped_ingredients[grouped_name].append(original_name)

            for grouped_name, original_names in grouped_ingredients.items():
                cursor.execute("SELECT id FROM ingredients WHERE name = ?", (grouped_name,))
                # cursor.execute("SELECT id FROM ingredients WHERE ingredient_name = ?", (grouped_name,))

                target_row = cursor.fetchone()

                if target_row:
                    target_id = target_row[0]
                    logger.info(f"Target ingredient '{grouped_name}' already exists with id {target_id}")
                else:
                    cursor.execute("SELECT id FROM ingredients WHERE name = ? LIMIT 1", (original_names[0],))
                    first_row = cursor.fetchone()
                    if first_row:
                        target_id = first_row[0]
                        cursor.execute("UPDATE ingredients SET name = ? WHERE id = ?", (grouped_name, target_id))
                        logger.info(f"Updated first ingredient '{original_names[0]}' -> '{grouped_name}' (id: {target_id})")
                        original_names = original_names[1:]
                    else:
                        continue

                for original_name in original_names:
                    cursor.execute("SELECT id FROM ingredients WHERE name = ?", (original_name,))
                    source_row = cursor.fetchone()
                    if source_row:
                        source_id = source_row[0]

                        cursor.execute("""
                            UPDATE dish_ingredients
                            SET ingredient_id = ?
                            WHERE ingredient_id = ?
                            AND NOT EXISTS (
                                SELECT 1 FROM dish_ingredients di2
                                WHERE di2.dish_id = dish_ingredients.dish_id
                                AND di2.ingredient_id = ?
                            )
                        """, (target_id, source_id, target_id))

                        # cursor.execute("""
                        #     UPDATE dish_ingredients
                        #     SET ingredient_id = ?
                        #     WHERE ingredient_id = ?
                        #     AND NOT EXISTS (
                        #         SELECT 1 FROM dish_ingredients di2
                        #         WHERE di2.dish_id = dish_ingredients.dish_id
                        #         AND di2.ingredient_id = ?
                        #     )
                        # """, (target_id, source_id, target_id))

                        cursor.execute("DELETE FROM ingredients WHERE id = ?", (source_id,))
                        # cursor.execute("DELETE FROM ingredients WHERE ingredient_id = ?", (source_id,))

                        updated_count += 1
                        logger.info(f"Merged ingredient '{original_name}' into '{grouped_name}'")

            conn.commit()
            conn.close()

            logger.info(f"Successfully merged {updated_count} ingredients in SQLite")
            return updated_count

        except Exception as e:
            logger.error(f"Error updating ingredient names in SQLite: {e}")
            return 0
    else:
        logger.info("Updating ingredient names in PostgreSQL database...")

        connection_params = {
            'host': os.getenv('POSTGRES_HOST', 'localhost'),
            'port': int(os.getenv('POSTGRES_PORT', '5432')),
            'user': os.getenv('POSTGRES_USER', 'username'),
            'password': os.getenv('POSTGRES_PASSWORD', 'password'),
            'database': os.getenv('POSTGRES_DB', 'default_database')
        }

        try:
            conn = await asyncpg.connect(**connection_params)

            grouped_ingredients = {}
            for original_name, grouped_name in flat_mapping.items():
                if original_name != grouped_name:
                    if grouped_name not in grouped_ingredients:
                        grouped_ingredients[grouped_name] = []
                    grouped_ingredients[grouped_name].append(original_name)

            for grouped_name, original_names in grouped_ingredients.items():
                target_row = await conn.fetchrow("SELECT ingredient_id FROM ingredients WHERE ingredient_name = $1", grouped_name)
                # target_row = await conn.fetchrow("SELECT id FROM ingredients WHERE name = $1", grouped_name)

                if target_row:
                    target_id = target_row['ingredient_id']
                    # target_id = target_row['id']
                    logger.info(f"Target ingredient '{grouped_name}' already exists with id {target_id}")
                else:
                    first_row = await conn.fetchrow("SELECT ingredient_id FROM ingredients WHERE ingredient_name = $1", original_names[0])
                    # first_row = await conn.fetchrow("SELECT id FROM ingredients WHERE name = $1", original_names[0])

                    if first_row:
                        target_id = first_row['ingredient_id']
                        # target_id = first_row['id']

                        await conn.execute("UPDATE ingredients SET ingredient_name = $1 WHERE ingredient_id = $2", grouped_name, target_id)
                        # await conn.execute("UPDATE ingredients SET name = $1 WHERE id = $2", grouped_name, target_id)

                        logger.info(f"Updated first ingredient '{original_names[0]}' -> '{grouped_name}' (id: {target_id})")
                        original_names = original_names[1:]
                    else:
                        continue

                for original_name in original_names:
                    source_row = await conn.fetchrow("SELECT ingredient_id FROM ingredients WHERE ingredient_name = $1", original_name)
                    # source_row = await conn.fetchrow("SELECT id FROM ingredients WHERE name = $1", original_name)

                    if source_row:
                        source_id = source_row['ingredient_id']
                        # source_id = source_row['id']

                        await conn.execute("""
                            UPDATE dish_ingredients
                            SET ingredient_id = $1
                            WHERE ingredient_id = $2
                            AND NOT EXISTS (
                                SELECT 1 FROM dish_ingredients di2
                                WHERE di2.dish_id = dish_ingredients.dish_id
                                AND di2.ingredient_id = $1
                            )
                        """, target_id, source_id)

                        # await conn.execute("""
                        #     UPDATE dish_ingredients
                        #     SET id = $1
                        #     WHERE id = $2
                        #     AND NOT EXISTS (
                        #         SELECT 1 FROM dish_ingredients di2
                        #         WHERE di2.id = dish_ingredients.id
                        #         AND di2.id = $1
                        #     )
                        # """, target_id, source_id)

                        await conn.execute("DELETE FROM ingredients WHERE ingredient_id = $1", source_id)
                        # await conn.execute("DELETE FROM ingredients WHERE id = $1", source_id)
                        updated_count += 1
                        logger.info(f"Merged ingredient '{original_name}' into '{grouped_name}'")

            await conn.close()

            logger.info(f"Successfully merged {updated_count} ingredients in PostgreSQL")
            return updated_count

        except Exception as e:
            logger.error(f"Error updating ingredient names in PostgreSQL: {e}")
            return 0


async def get_dishes_with_ingredients(use_sqlite: Optional[bool] = True, limit: Optional[int] = None) -> List[Dict]:
    """Fetch dishes with their ingredients from the database."""

    if use_sqlite:
        logger.info("Fetching dishes with ingredients from SQLite database...")
        sqlite_path = Path(__file__).parent / "sample" / "recipes.sqlite"

        if not sqlite_path.exists():
            logger.error(f"SQLite database not found at {sqlite_path}")
            return []

        try:
            conn = sqlite3.connect(sqlite_path)
            cursor = conn.cursor()

            limit_clause = f"LIMIT {limit}" if limit else ""

            query = f"""
                SELECT
                    d.id as dish_id,
                    d.name as dish_name,
                    d.course,
                    i.name as ingredient_name,
                    di.amount,
                    di.unit
                FROM dishes d
                LEFT JOIN dish_ingredients di ON d.id = di.dish_id
                LEFT JOIN ingredients i ON di.ingredient_id = i.id
                ORDER BY d.name, i.name
                {limit_clause}
            """
            # PostgreSQL equivalent:
            # SELECT
            #     d.dish_id,
            #     d.dish_name,
            #     d.course,
            #     i.ingredient_name,
            #     di.amount,
            #     di.unit
            # FROM dishes d
            # LEFT JOIN dish_ingredients di ON d.dish_id = di.dish_id
            # LEFT JOIN ingredients i ON di.ingredient_id = i.ingredient_id
            # ORDER BY d.dish_name, i.ingredient_name

            cursor.execute(query)
            rows = cursor.fetchall()

            dishes_dict = {}
            for row in rows:
                dish_id, dish_name, course, ingredient_name, amount, unit = row

                if dish_id not in dishes_dict:
                    dishes_dict[dish_id] = {
                        'dish_id': dish_id,
                        'dish_name': dish_name,
                        'course': course,
                        'ingredients': []
                    }

                if ingredient_name:
                    dishes_dict[dish_id]['ingredients'].append({
                        'name': ingredient_name,
                        'amount': amount,
                        'unit': unit
                    })

            dishes = list(dishes_dict.values())
            logger.info(f"Successfully loaded {len(dishes)} dishes from SQLite")

            conn.close()
            return dishes

        except Exception as e:
            logger.error(f"Error fetching dishes from SQLite: {e}")
            return []
    else:
        logger.info("Fetching dishes with ingredients from PostgreSQL database...")

        connection_params = {
            'host': os.getenv('POSTGRES_HOST', 'localhost'),
            'port': int(os.getenv('POSTGRES_PORT', '5432')),
            'user': os.getenv('POSTGRES_USER', 'username'),
            'password': os.getenv('POSTGRES_PASSWORD', 'password'),
            'database': os.getenv('POSTGRES_DB', 'default_database')
        }

        try:
            conn = await asyncpg.connect(**connection_params)

            limit_clause = f"LIMIT {limit}" if limit else ""

            query = f"""
                SELECT
                    d.dish_id,
                    d.dish_name,
                    d.course,
                    i.ingredient_name,
                    di.amount,
                    di.unit
                FROM dishes d
                LEFT JOIN dish_ingredients di ON d.dish_id = di.dish_id
                LEFT JOIN ingredients i ON di.ingredient_id = i.ingredient_id
                ORDER BY d.dish_name, i.ingredient_name
                {limit_clause}
            """
            # SQLite equivalent:
            # SELECT
            #     d.id as dish_id,
            #     d.name as dish_name,
            #     d.course,
            #     i.name as ingredient_name,
            #     di.amount,
            #     di.unit
            # FROM dishes d
            # LEFT JOIN dish_ingredients di ON d.id = di.dish_id
            # LEFT JOIN ingredients i ON di.ingredient_id = i.id
            # ORDER BY d.name, i.name

            rows = await conn.fetch(query)

            dishes_dict = {}
            for row in rows:
                dish_id = row['dish_id']
                dish_name = row['dish_name']
                course = row['course']
                ingredient_name = row['ingredient_name']
                amount = row['amount']
                unit = row['unit']

                if dish_id not in dishes_dict:
                    dishes_dict[dish_id] = {
                        'dish_id': dish_id,
                        'dish_name': dish_name,
                        'course': course,
                        'ingredients': []
                    }

                if ingredient_name:
                    dishes_dict[dish_id]['ingredients'].append({
                        'name': ingredient_name,
                        'amount': amount,
                        'unit': unit
                    })

            dishes = list(dishes_dict.values())
            logger.info(f"Successfully loaded {len(dishes)} dishes from PostgreSQL")

            await conn.close()
            return dishes

        except Exception as e:
            logger.error(f"Error fetching dishes from PostgreSQL: {e}")
            return []
