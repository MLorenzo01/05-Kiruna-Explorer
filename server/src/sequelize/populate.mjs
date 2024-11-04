export default async function populateDB(sequelize) {
    console.log("Populating the database...");
    const { Document, Stakeholder } = sequelize.models;
    try {
        // Create stakeholders
        const stakeholders = await Stakeholder.bulkCreate(
            [
                {
                    name: "LKAB",
                    color: "#000000",
                },
                {
                    name: "Municipality",
                    color: "#FF0000",
                },
                {
                    name: "Norrbotten County",
                    color: "#00FF00",
                },
                {
                    name: "Architecture firms",
                    color: "#0000FF",
                },
                {
                    name: "Citizens",
                    color: "#FFFF00",
                },
                {
                    name: "Others",
                    color: "#00FFFF",
                },
            ],
            { validate: true }
        );

        //Create documents
        const documents = await Document.bulkCreate(
            [
                {
                    title: "Compilation of responses “So what the people of Kiruna think?” (15)",
                    scaleType: "Text",
                    issuanceDate: "2007",
                    type: "Informative Document",
                    language: "Swedish",
                    description:
                        "This document is a compilation of the responses to the survey 'What is your impression of Kiruna?' From the citizens' responses to this last part of the survey, it is evident that certain buildings, such as the Kiruna Church, the Hjalmar Lundbohmsgården, and the Town Hall, are considered of significant value to the population. The municipality views the experience of this survey positively, to the extent that over the years it will propose various consultation opportunities.",
                },
                {
                    title: "Detail plan for Bolagsomradet Gruvstadspark (18)",
                    scaleType: "Plan",
                    scaleValue: "1:8.000",
                    issuanceDate: "2010-10-20",
                    type: "Prescriptive Document",
                    language: "Swedish",
                    pages: "1-32",
                    description:
                        "This is the first of 8 detailed plans located in the old center of Kiruna, aimed at transforming the residential areas into mining industry zones to allow the demolition of buildings. The area includes the town hall, the Ullspiran district, and the A10 highway, and it will be the first to be dismantled. The plan consists, like all detailed plans, of two documents: the area map that regulates it, and a text explaining the reasons that led to the drafting of the plan with these characteristics. The plan gained legal validity in 2012.",
                },
                {
                    title: "Development Plan (41)",
                    scaleType: "Plan",
                    scaleValue: "1:7.500",
                    issuanceDate: "2014-03-17",
                    type: "Design Document",
                    language: "Swedish",
                    pages: "111",
                    description:
                        "The development plan shapes the form of the new city. The document, unlike previous competition documents, is written entirely in Swedish, which reflects the target audience: the citizens of Kiruna. The plan obviously contains many elements of the winning masterplan from the competition, some recommended by the jury, and others that were deemed appropriate to integrate later. The document is divided into four parts, with the third part, spanning 80 pages, describing the shape the new city will take and the strategies to be implemented for its relocation through plans, sections, images, diagrams, and texts. The document also includes numerous studies aimed at demonstrating the future success of the project.",
                },
                {
                    title: "Deformation forecast (45)",
                    scaleType: "Plan",
                    scaleValue: "1:12.500",
                    issuanceDate: "2014-12",
                    type: "Technical Document",
                    language: "Swedish",
                    pages: "1",
                    description:
                        "The development plan shapes the form of the new city. The document, unlike previous competition documents, is written entirely in Swedish, which reflects the target audience: the citizens of Kiruna. The plan obviously contains many elements of the winning masterplan from the competition, some recommended by the jury, and others that were deemed appropriate to integrate later. The document is divided into four parts, with the third part, spanning 80 pages, describing the shape the new city will take and the strategies to be implemented for its relocation through plans, sections, images, diagrams, and texts. The document also includes numerous studies aimed at demonstrating the future success of the project"
                },

                {
                    title: "Adjusted development plan (47)",
                    scaleType: "Scale",
                    scaleValue: "1:7.500",
                    issuanceDate: "2015",
                    type: "Design Document",
                    language: "Swedish",
                    pages: "1",
                    description: "This document is the update of the Development Plan, one year after its creation, modifications are made to the general master plan, which is published under the name 'Adjusted Development Plan91,' and still represents the version used today after 10 years. Certainly, there are no drastic differences compared to the previous plan, but upon careful comparison, several modified elements stand out. For example, the central square now takes its final shape, as well as the large school complex just north of it, which appears for the first time."
                },
                {
                    title: "Detail plan for square and commercial street (50)",
                    scaleType: "Scale",
                    scaleValue: "1:1.000",
                    issuanceDate: "2016-06-22",
                    type: "Prescriptive Document",
                    language: "Swedish",
                    pages: "1-43",
                    description: "This plan, approved in July 2016, is the first detailed plan to be implemented from the new masterplan (Adjusted development plan). The document defines the entire area near the town hall, comprising a total of 9 blocks known for their density. Among these are the 6 buildings that will face the main square. The functions are mixed, both public and private, with residential being prominent, as well as the possibility of incorporating accommodation facilities such as hotels. For all buildings in this plan, the only height limit is imposed by air traffic."
                },
                {
                    title: "Construction of Scandic Hotel begins (63)",
                    scaleType: "Blueprints/effects",
                    issuanceDate: "2019-04",
                    type: "Material Effect",
                    language: "-",
                    pages: "-",
                    coordinates: "67°50'54.7\"N 20°18'17.2\"E",
                    description: "After two extensions of the land acquisition agreement, necessary because this document in Sweden is valid for only two years, construction of the hotel finally began in 2019."
                },
                {
                    title: "Town Hall demolition (64)",
                    scaleType: "Blueprints/effects",
                    issuanceDate: "2019-04",
                    type: "Material Effect",
                    language: "-",
                    pages: "-",
                    coordinates: "67°51'09.0\"N 20°13'20.8\"E",
                    description: "After the construction of the new town hall was completed, the old building, nicknamed \"The Igloo,\" was demolished. The only elements preserved were the door handles, a masterpiece of Sami art made of wood and bone, and the clock tower, which once stood on the roof of the old town hall. The clock tower was relocated to the central square of New Kiruna, in front of the new building."
                },
                {
                    title: "Construction of Aurora Center begins (65)",
                    scaleType: "Blueprints/effects",
                    issuanceDate: "2019-05",
                    type: "Material Effect",
                    language: "-",
                    pages: "-",
                    coordinates: "67°50'57.0\"N 20°18'15.8\"E",
                    description: "Shortly after the construction of the Scandic hotel began, work on the Aurora Center also started, a multifunctional complex that includes the municipal library of Kiruna. The two buildings are close to each other and connected by a skywalk, just like in the old town center."
                },
                {
                    title: "Construction of Block 1 begins(69)",
                    scaleType: "Blueprints/effects",
                    issuanceDate: "2019-06",
                    type: "Material Effect",
                    language: "-",
                    pages: "-",
                    coordinates: "67°50'54.8\"N 20°18'01.2\"E",
                    description: "Simultaneously with the start of construction on the Aurora Center, work also began on Block 1, another mixed-use building overlooking the main square and the road leading to old Kiruna. These are the first residential buildings in the new town."
                }
            ],
            { validate: true }
        );

        await documents[0].setStakeholders([
            stakeholders[1].id,
            stakeholders[4].id,
        ]);
        await documents[1].setStakeholders(stakeholders[1]);
        await documents[2].setStakeholders([stakeholders[1], stakeholders[3]]);

        await documents[3].setStakeholders(stakeholders[0]);
        await documents[4].setStakeholders([stakeholders[1], stakeholders[3]]);
        await documents[5].setStakeholders(stakeholders[1]);
        await documents[6].setStakeholders(stakeholders[0]);
        await documents[7].setStakeholders(stakeholders[0]);
        await documents[8].setStakeholders(stakeholders[0]);
        await documents[9].setStakeholders(stakeholders[0]);


        await documents[0].addConnectedDocument(documents[1], {
            through: { relationship: "Update" },
        });
        await documents[1].addConnectedDocument(documents[0], {
            through: { relationship: "Update" },
        });
        await documents[1].addConnectedDocument(documents[2], {
            through: { relationship: "Collateral Consequence" },
        });
        await documents[2].addConnectedDocument(documents[1], {
            through: { relationship: "Collateral Consequence" },
        });

        console.log("Database populated successfully.");
    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }
}
