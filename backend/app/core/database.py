"""
Database connection and models for Kisan GPT
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, TEXT
from app.core.config import settings
from loguru import logger

# Global database client
client: AsyncIOMotorClient = None
database = None


async def init_database():
    """Initialize database connection and create indexes"""
    global client, database
    
    try:
        # Create MongoDB client
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        database = client[settings.MONGODB_DATABASE]
        
        # Test connection
        await client.admin.command('ping')
        logger.info(f"Connected to MongoDB: {settings.MONGODB_DATABASE}")
        
        # Create indexes for better performance
        await create_indexes()
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # Users collection indexes
        await database.users.create_index("user_id", unique=True)
        await database.users.create_index("phone")
        await database.users.create_index("district")
        
        # Sessions collection indexes
        await database.sessions.create_index("session_id", unique=True)
        await database.sessions.create_index("user_id")
        await database.sessions.create_index("timestamp")
        await database.sessions.create_index([("timestamp", -1)])
        
        # Predictions collection indexes
        await database.predictions.create_index("prediction_id", unique=True)
        await database.predictions.create_index("user_id")
        await database.predictions.create_index("created_at")
        await database.predictions.create_index([("created_at", -1)])
        await database.predictions.create_index("model_version")
        
        # Market prices collection indexes
        await database.market_prices.create_index([("district", 1), ("crop", 1), ("date", -1)])
        await database.market_prices.create_index("date")
        await database.market_prices.create_index([("date", -1)])
        
        # Historical yields collection indexes
        await database.historical_yields.create_index([("district", 1), ("crop", 1), ("year", -1)])
        await database.historical_yields.create_index("year")
        
        # Disease predictions collection indexes
        await database.disease_predictions.create_index([("district", 1), ("crop", 1)])
        await database.disease_predictions.create_index("prediction_date")
        await database.disease_predictions.create_index([("prediction_date", -1)])
        
        # Community data collection indexes
        await database.community_data.create_index("agro_zone")
        await database.community_data.create_index("anonymized_location")
        
        # Text search indexes
        await database.sessions.create_index([("transcript", TEXT)])
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create database indexes: {e}")


async def close_database():
    """Close database connection"""
    global client
    if client:
        client.close()
        logger.info("Database connection closed")


def get_database():
    """Get database instance"""
    return database


# Collection getters
def get_users_collection():
    """Get users collection"""
    return database.users


def get_sessions_collection():
    """Get sessions collection"""
    return database.sessions


def get_predictions_collection():
    """Get predictions collection"""
    return database.predictions


def get_market_prices_collection():
    """Get market prices collection"""
    return database.market_prices


def get_historical_yields_collection():
    """Get historical yields collection"""
    return database.historical_yields


def get_disease_predictions_collection():
    """Get disease predictions collection"""
    return database.disease_predictions


def get_community_data_collection():
    """Get community data collection"""
    return database.community_data